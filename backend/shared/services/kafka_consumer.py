import json
import logging
from confluent_kafka import Consumer, KafkaException
from shared.config.kafka_config import get_consumer_config

logger = logging.getLogger(__name__)


class KafkaConsumerService:
    """Shared Kafka consumer service for consuming events"""

    def __init__(self, group_id: str, topics: list):
        """
        Initialize Kafka consumer.

        Args:
            group_id: Consumer group ID
            topics: List of topics to subscribe to
        """
        self.consumer = Consumer(get_consumer_config(group_id))
        self.consumer.subscribe(topics)
        self.group_id = group_id
        self.topics = topics
        logger.info(f"Kafka consumer initialized (group_id: {group_id}, topics: {topics})")

    def poll(self, timeout: float = 1.0):
        """
        Poll for new messages.

        Args:
            timeout: Poll timeout in seconds

        Returns:
            Message object or None
        """
        return self.consumer.poll(timeout=timeout)

    def close(self):
        """Close consumer connection"""
        self.consumer.close()
        logger.info(f"Kafka consumer closed (group_id: {self.group_id})")