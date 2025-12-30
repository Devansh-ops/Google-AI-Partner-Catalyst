import json
import logging
from confluent_kafka import Producer
from shared.config.kafka_config import get_producer_config
from shared.utils.kafka_utils import delivery_callback

logger = logging.getLogger(__name__)


class KafkaProducerService:
    """Shared Kafka producer service for publishing events"""

    def __init__(self, client_id: str = None):
        """
        Initialize Kafka producer.

        Args:
            client_id: Optional client ID for producer identification
        """
        config = get_producer_config()
        if client_id:
            config['client.id'] = client_id

        self.producer = Producer(config)
        logger.info(f"Kafka producer initialized (client_id: {config.get('client.id', 'default')})")

    def send_event(self, topic: str, session_id: str, event_data: dict):
        """
        Send event to Kafka topic.

        Args:
            topic: Kafka topic name
            session_id: Session ID (used as Kafka key for partitioning)
            event_data: Event data dictionary (will be JSON serialized)
        """
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