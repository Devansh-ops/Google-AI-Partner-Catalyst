"""
Pattern Detection Stream Processor

Simplified processor that handles 5 event types:
- CODE_CHANGE: Tracks code changes, sends to queue if significant (3+ lines)
- TAB_SWITCH: Makes direct HTTP call to hint-generator
- HINT_REQUEST: Collects last 5 iterations and sends to queue
- TEST_RUN: Forwards test results with code to queue
- GIVE_UP: Forwards problem info to queue for full solution
"""
import json
import logging
import signal
import sys
import time
import requests
from typing import Dict, List
from datetime import datetime
from difflib import unified_diff

from config import ProcessorConfig
from shared.services import KafkaConsumerService, KafkaProducerService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SessionState:
    """Simplified session state for tracking code iterations"""
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.code_history: List[Dict] = []  # {timestamp, code, test_status, error_message}
        self.problem_title = ""
        self.problem_description = ""
        self.last_code = ""

    def add_code_iteration(self, code: str, timestamp: str, test_status=None, error_message=None):
        """Add code iteration to history"""
        self.code_history.append({
            'timestamp': timestamp,
            'code': code,
            'test_status': test_status,
            'error_message': error_message
        })
        # Keep only last 10 iterations
        if len(self.code_history) > 10:
            self.code_history = self.code_history[-10:]
        self.last_code = code

    def get_last_n_iterations(self, n=5) -> List[Dict]:
        """Get last n iterations"""
        return self.code_history[-n:]

    def has_significant_change(self, new_code: str) -> bool:
        """Check if code has changed by 3+ lines"""
        if not self.last_code:
            return True

        old_lines = self.last_code.strip().split('\n')
        new_lines = new_code.strip().split('\n')

        diff = list(unified_diff(old_lines, new_lines, lineterm=''))
        # Count actual code changes (lines starting with + or -)
        changes = [line for line in diff if line.startswith(('+', '-')) and not line.startswith(('+++', '---'))]

        return len(changes) >= 3


class PatternProcessor:
    """Simplified pattern processor for 5 event types"""

    def __init__(self):
        self.config = ProcessorConfig()

        # In-memory state store (no persistence needed for simplified architecture)
        self.sessions: Dict[str, SessionState] = {}

        # Kafka consumer/producer
        self.consumer = KafkaConsumerService(
            group_id='pattern-processor-group',
            topics=[self.config.TOPIC_EVENTS]
        )
        self.producer = KafkaProducerService(client_id='pattern-processor-producer')

        self.running = True
        self.events_processed = 0

        logger.info("Pattern Processor initialized")
        logger.info(f"Consuming from: {self.config.TOPIC_EVENTS}")

    def get_or_create_session(self, session_id: str) -> SessionState:
        """Get or create session state"""
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id)
        return self.sessions[session_id]

    def handle_code_change(self, event: dict):
        """CODE_CHANGE: Check for significant changes (3+ lines)"""
        session_id = event.get('session_id')
        code = event.get('code', '')
        timestamp = event.get('timestamp')

        session = self.get_or_create_session(session_id)

        # Update problem info if provided
        if event.get('problem_title'):
            session.problem_title = event['problem_title']
        if event.get('problem_description'):
            session.problem_description = event['problem_description']

        # Check for significant change
        if session.has_significant_change(code):
            logger.info(f"Significant code change detected for {session_id}")

            # Add to history
            session.add_code_iteration(code, timestamp)

            # Send to queue for hint-generator
            hint_request = {
                'event_type': 'CODE_CHANGE',
                'message_for': 'hint-generator',  # Route to hint-generator
                'session_id': session_id,
                'timestamp': timestamp,
                'problem_title': session.problem_title,
                'problem_description': session.problem_description,
                'previous_code': session.get_last_n_iterations(2)[0]['code'] if len(session.code_history) >= 2 else '',
                'current_code': code,
                'tone': event.get('tone'),
                'experience_level': event.get('experience_level')
            }

            self.producer.send_event(
                topic=self.config.TOPIC_EVENTS,
                session_id=session_id,
                event_data=hint_request
            )
            logger.info(f"Sent CODE_CHANGE to queue for hint-generator ({session_id})")
        else:
            # Just update the code, no hint needed
            session.last_code = code
            logger.info(f"Minor code change for {session_id}, not sending hint")

    def handle_tab_switch(self, event: dict):
        """TAB_SWITCH: Make direct HTTP call to hint-generator"""
        session_id = event.get('session_id')
        session = self.get_or_create_session(session_id)

        logger.info(f"TAB_SWITCH detected for {session_id}, making direct HTTP call")

        try:
            # Make HTTP POST to hint-generator
            response = requests.post(
                f"http://hint-generator:8080/generate-hint",
                json={
                    'event_type': 'TAB_SWITCH',
                    'session_id': session_id,
                    'timestamp': event.get('timestamp'),
                    'problem_title': session.problem_title,
                    'problem_description': session.problem_description,
                    'problem_description': session.problem_description,
                    'current_code': session.last_code,
                    'tone': event.get('tone'),
                    'experience_level': event.get('experience_level')
                },
                timeout=10
            )

            if response.status_code == 200:
                hint_data = response.json()
                # Send hint directly to responses topic
                self.producer.send_event(
                    topic=self.config.TOPIC_HINTS_RESPONSES,
                    session_id=session_id,
                    event_data=hint_data
                )
                logger.info(f"TAB_SWITCH hint sent for {session_id}")
            else:
                logger.error(f"Hint-generator returned {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to call hint-generator: {e}")

    def handle_hint_request(self, event: dict):
        """HINT_REQUEST: Send last 5 iterations to queue"""
        session_id = event.get('session_id')
        session = self.get_or_create_session(session_id)

        logger.info(f"HINT_REQUEST for {session_id}")

        iterations = session.get_last_n_iterations(5)

        hint_request = {
            'event_type': 'HINT_REQUEST',
            'message_for': 'hint-generator',  # Route to hint-generator
            'session_id': session_id,
            'timestamp': event.get('timestamp'),
            'problem_title': session.problem_title,
            'problem_description': session.problem_description,
            'current_code': session.last_code,
            'iterations': iterations,
            'tone': event.get('tone'),
            'experience_level': event.get('experience_level')
        }

        self.producer.send_event(
            topic=self.config.TOPIC_EVENTS,
            session_id=session_id,
            event_data=hint_request
        )
        logger.info(f"Sent HINT_REQUEST with {len(iterations)} iterations to hint-generator ({session_id})")

    def handle_test_run(self, event: dict):
        """TEST_RUN: Forward test results with code to queue"""
        session_id = event.get('session_id')
        code = event.get('code', '')
        test_status = event.get('test_status')
        error_message = event.get('error_message', '')
        timestamp = event.get('timestamp')

        session = self.get_or_create_session(session_id)

        # Update problem info if provided
        if event.get('problem_title'):
            session.problem_title = event['problem_title']
        if event.get('problem_description'):
            session.problem_description = event['problem_description']

        # Add to history
        session.add_code_iteration(code, timestamp, test_status, error_message)

        logger.info(f"TEST_RUN for {session_id}: {test_status}")

        # Send to queue for hint-generator
        hint_request = {
            'event_type': 'TEST_RUN',
            'message_for': 'hint-generator',  # Route to hint-generator
            'session_id': session_id,
            'timestamp': timestamp,
            'problem_title': session.problem_title,
            'problem_description': session.problem_description,
            'code': code,
            'test_status': test_status,
            'error_message': error_message,
            'tone': event.get('tone'),
            'experience_level': event.get('experience_level')
        }

        self.producer.send_event(
            topic=self.config.TOPIC_EVENTS,
            session_id=session_id,
            event_data=hint_request
        )
        logger.info(f"Sent TEST_RUN to hint-generator ({session_id})")

    def handle_give_up(self, event: dict):
        """GIVE_UP: Forward problem info to queue for full solution"""
        session_id = event.get('session_id')
        session = self.get_or_create_session(session_id)

        # Update problem info if provided
        if event.get('problem_title'):
            session.problem_title = event['problem_title']
        if event.get('problem_description'):
            session.problem_description = event['problem_description']

        logger.info(f"GIVE_UP for {session_id}")

        hint_request = {
            'event_type': 'GIVE_UP',
            'message_for': 'hint-generator',  # Route to hint-generator
            'session_id': session_id,
            'timestamp': event.get('timestamp'),
            'problem_title': session.problem_title,
            'problem_description': session.problem_description,
            'tone': event.get('tone'),
            'experience_level': event.get('experience_level')
        }

        self.producer.send_event(
            topic=self.config.TOPIC_EVENTS,
            session_id=session_id,
            event_data=hint_request
        )
        logger.info(f"Sent GIVE_UP to hint-generator ({session_id})")

    def process_event(self, event: dict):
        """Route event to appropriate handler"""
        try:
            event_type = event.get('event_type')
            session_id = event.get('session_id')
            message_for = event.get('message_for')

            if not session_id:
                logger.warning("Event missing session_id, skipping")
                return

            # Only process messages intended for pattern-processor
            if message_for != 'pattern-processor':
                logger.debug(f"Skipping message for {message_for}")
                return

            logger.info(f"Processing {event_type} for {session_id}")

            # Route to handler
            if event_type == 'CODE_CHANGE':
                self.handle_code_change(event)
            elif event_type == 'TAB_SWITCH':
                self.handle_tab_switch(event)
            elif event_type == 'HINT_REQUEST':
                self.handle_hint_request(event)
            elif event_type == 'TEST_RUN':
                self.handle_test_run(event)
            elif event_type == 'GIVE_UP':
                self.handle_give_up(event)
            else:
                logger.warning(f"Unknown event type: {event_type}")

            self.events_processed += 1

        except Exception as e:
            logger.error(f"Error processing event: {e}", exc_info=True)

    def run(self):
        """Main processing loop"""
        logger.info("Starting Pattern Processor...")

        # Shutdown handler
        def signal_handler(signum, frame):
            logger.info("Shutdown signal received")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        try:
            while self.running:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

                # Parse and process event
                try:
                    event = json.loads(msg.value().decode('utf-8'))
                    self.process_event(event)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse event JSON: {e}")
                    continue

        finally:
            self.consumer.close()
            self.producer.close()
            logger.info(f"Pattern Processor stopped. Total events: {self.events_processed}")


if __name__ == "__main__":
    try:
        processor = PatternProcessor()
        processor.run()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
