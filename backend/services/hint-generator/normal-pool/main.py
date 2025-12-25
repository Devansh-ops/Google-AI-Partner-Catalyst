import json
import logging
import time
import sys
import os
from confluent_kafka import Consumer, Producer

# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from config import config
from vertex_ai_client import VertexAIClient, build_prompt
from shared.config.kafka_config import get_consumer_config, get_producer_config
from shared.utils.kafka_utils import delivery_callback

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HintGeneratorService:
    def __init__(self):
        self.consumer = Consumer(get_consumer_config(config.CONSUMER_GROUP_ID))
        self.producer = Producer(get_producer_config())
        self.vertex_ai = VertexAIClient()
        
        # Subscribe to events topic
        self.consumer.subscribe([config.TOPIC_EVENTS_REALTIME])
        logger.info(f"Subscribed to topic: {config.TOPIC_EVENTS_REALTIME}")
    
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
            self.producer.flush()
    
    def process_event(self, msg):
        """Process a single event"""
        try:
            # Parse event
            event = json.loads(msg.value().decode('utf-8'))
            session_id = event.get('session_id')
            
            logger.info(f"Processing event for session {session_id}")
            
            # Build prompt
            prompt = build_prompt(event)
            
            # Generate hint using Gemini
            hint_text = self.vertex_ai.generate_hint(prompt)
            
            # Build hint response
            hint_response = {
                'type': 'hint',
                'session_id': session_id,
                'hint': hint_text,
                'timestamp': event.get('timestamp'),
                'event_type': event.get('event_type')
            }
            
            # Send hint to responses topic
            self.producer.produce(
                topic=config.TOPIC_HINTS_RESPONSES,
                key=session_id,
                value=json.dumps(hint_response),
                callback=delivery_callback
            )
            self.producer.flush()
            
            logger.info(f"Hint sent for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error processing event: {e}")


if __name__ == "__main__":
    service = HintGeneratorService()
    service.run()