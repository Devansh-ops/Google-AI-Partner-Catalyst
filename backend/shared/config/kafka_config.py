import os


def get_kafka_base_config():
    """Returns base Kafka configuration for both producer and consumer"""
    return {
        'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS'),
        'security.protocol': 'SASL_SSL',
        'sasl.mechanisms': 'PLAIN',
        'sasl.username': os.getenv('KAFKA_API_KEY'),
        'sasl.password': os.getenv('KAFKA_API_SECRET'),
    }


def get_producer_config():
    """Returns Kafka producer configuration"""
    return {
        **get_kafka_base_config(),
        'client.id': 'api-gateway-producer',
        'acks': 'all',
        'compression.type': 'snappy',
    }


def get_consumer_config(group_id: str):
    """Returns Kafka consumer configuration"""
    return {
        **get_kafka_base_config(),
        'group.id': group_id,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True,
    }