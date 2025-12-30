import os
import socket
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Server
    PORT = int(os.getenv('PORT', 8000))
    HOST = os.getenv('HOST', '0.0.0.0')

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS')
    KAFKA_API_KEY = os.getenv('KAFKA_API_KEY')
    KAFKA_API_SECRET = os.getenv('KAFKA_API_SECRET')

    # Topics - Using two topics to minimize EKCU costs
    TOPIC_EVENTS = 'events.realtime'  # All incoming events
    TOPIC_HINTS_RESPONSES = 'hints.responses'  # All hint responses

    # Consumer Group ID - Unique per instance to prevent conflicts
    # Use CONSUMER_GROUP_ID env var for custom ID, or auto-generate from hostname
    CONSUMER_GROUP_ID = os.getenv('CONSUMER_GROUP_ID', f'api-gateway-{socket.gethostname()}-{os.getpid()}')


config = Config()