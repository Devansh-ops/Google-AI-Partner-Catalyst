import logging

logger = logging.getLogger(__name__)


def delivery_callback(err, msg):
    """Kafka message delivery callback"""
    if err:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')