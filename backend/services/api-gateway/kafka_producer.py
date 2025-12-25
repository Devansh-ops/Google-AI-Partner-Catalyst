import json
import logging
from confluent_kafka import Producer
import sys
import os

# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from shared.config.kafka_config import get_producer_config
from shared.utils.kafka_utils import delivery_callback

logger = logging.getLogger(__name__)


class KafkaProducerService:
    def __init__(self):
        self.producer = Producer(get_producer_config())
        logger.info("Kafka producer initialized")
    
    def send_event(self, topic: str, session_id: str, event_data: dict):
        """Send event to Kafka topic"""
        try:
            event_json = json.dumps(event_data)
            self.producer.produce(
                topic=topic,
                key=session_id,
                value=event_json,
                callback=delivery_callback
            )
            self.producer.flush()
            logger.info(f"Event sent to {topic} for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to send event to Kafka: {e}")
            raise
    
    def close(self):
        """Close producer connection"""
        self.producer.flush()
        logger.info("Kafka producer closed")