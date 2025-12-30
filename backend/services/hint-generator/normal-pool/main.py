import json
import logging
import time
import sys
import os

# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from config import config
from vertex_ai_client import VertexAIClient, build_prompt
from shared.services import KafkaProducerService, KafkaConsumerService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HintGeneratorService:
    def __init__(self):
        # Initialize Kafka services using shared classes
        self.consumer = KafkaConsumerService(
            group_id=config.CONSUMER_GROUP_ID,
            topics=[config.TOPIC_EVENTS]
        )
        self.producer = KafkaProducerService(client_id='hint-generator-producer')
        self.vertex_ai = VertexAIClient()

        logger.info(f"Hint Generator initialized, consuming from {config.TOPIC_EVENTS}")

    def run(self):
        """Main processing loop"""
        logger.info("Hint Generator Service started")

        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

                # Process event
                self.process_event(msg)

        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            self.consumer.close()
            self.producer.close()

    def process_event(self, msg):
        """Process a single event"""
        try:
            # Parse event
            event = json.loads(msg.value().decode('utf-8'))
            session_id = event.get('session_id')
            event_type = event.get('event_type', 'unknown')
            message_for = event.get('message_for')

            # Only process messages intended for hint-generator
            if message_for != 'hint-generator':
                logger.debug(f"Skipping message for {message_for}")
                return

            # Process 4 event types from pattern-processor: CODE_CHANGE, HINT_REQUEST, TEST_RUN, GIVE_UP
            # TAB_SWITCH is handled via HTTP endpoint
            if event_type not in ['CODE_CHANGE', 'HINT_REQUEST', 'TEST_RUN', 'GIVE_UP']:
                logger.warning(f"Unknown event type: {event_type}")
                return

            logger.info(f"Processing {event_type} event for session {session_id}")

            # Build prompt
            prompt = build_prompt(event)

            # Determine if long response is needed
            # GIVE_UP needs very long response (1500 tokens for 3 approaches with code)
            # TEST_RUN with success needs medium response (400 tokens for congrats + optimization)
            # Others use default (200 tokens)
            if event_type == 'GIVE_UP':
                max_tokens = 1500
            elif event_type == 'TEST_RUN' and event.get('test_status') == 'success':
                max_tokens = 400
            else:
                max_tokens = 200

            # Generate hint using Gemini with custom max tokens
            hint_text = self.vertex_ai.generate_hint_with_tokens(prompt, max_tokens)

            # Build hint response
            hint_response = {
                'type': 'hint',
                'session_id': session_id,
                'hint': hint_text,
                'timestamp': event.get('timestamp'),
                'event_type': event_type
            }

            # Send hint to responses topic
            self.producer.send_event(
                topic=config.TOPIC_HINTS_RESPONSES,
                session_id=session_id,
                event_data=hint_response
            )

            logger.info(f"Hint sent for session {session_id}")

        except Exception as e:
            logger.error(f"Error processing event: {e}")


if __name__ == "__main__":
    service = HintGeneratorService()
    service.run()