import json
import logging
import sys
import os
import signal
from confluent_kafka import Consumer, Producer

# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from config import config
from agent import ChatAgent
from shared.config.kafka_config import get_consumer_config, get_producer_config
from shared.utils.kafka_utils import delivery_callback

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.running = True
        self.consumer = Consumer(get_consumer_config(config.CONSUMER_GROUP_ID))
        self.producer = Producer(get_producer_config())
        self.agent = ChatAgent()
        
        # Subscribe to chat events topic
        self.consumer.subscribe([config.TOPIC_CHAT_EVENTS])
        logger.info(f"Subscribed to topic: {config.TOPIC_CHAT_EVENTS}")
        
        # Handle signals
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

    def shutdown(self, signum, frame):
        logger.info("Shutting down Chat Service...")
        self.running = False

    def run(self):
        """Main processing loop"""
        logger.info("Chat Service started")
        
        try:
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue
                
                # Process event
                self.process_event(msg)
                
        finally:
            self.consumer.close()
            self.producer.flush()
            
    def process_event(self, msg):
        """Process a single chat event"""
        try:
            # Parse event
            event_data = json.loads(msg.value().decode('utf-8'))
            session_id = event_data.get('session_id')
            message = event_data.get('message')
            
            logger.info(f"Processing chat message for session {session_id}")
            
            # Extract context
            context = {
                'problem_context': event_data.get('problem_context', {}),
                'current_code': event_data.get('current_code', ''),
                'previous_hints': event_data.get('previous_hints', [])
            }
            
            # Generate response via Agent
            response_text = self.agent.generate_response(message, context)
            
            # Build response event
            response_event = {
                'type': 'chat_response',
                'session_id': session_id,
                'message': response_text,
                'timestamp': event_data.get('timestamp') # Or current time
            }
            
            # Send response to Kafka
            self.producer.produce(
                topic=config.TOPIC_CHAT_RESPONSES,
                key=session_id,
                value=json.dumps(response_event),
                callback=delivery_callback
            )
            self.producer.flush() # Ensure it's sent
            
            logger.info(f"Sent chat response for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error processing chat event: {e}")

if __name__ == "__main__":
    service = ChatService()
    service.run()
