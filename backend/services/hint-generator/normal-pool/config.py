import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Google Cloud
    GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT')
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './vertex-ai-key.json')
    VERTEX_AI_LOCATION = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    VERTEX_AI_MODEL = os.getenv('VERTEX_AI_MODEL', 'gemini-2.0-flash-exp')
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS')
    KAFKA_API_KEY = os.getenv('KAFKA_API_KEY')
    KAFKA_API_SECRET = os.getenv('KAFKA_API_SECRET')
    
    # Topics - Using two topics to minimize EKCU costs
    TOPIC_EVENTS = 'events.realtime'  # All incoming events
    TOPIC_HINTS_RESPONSES = 'hints.responses'  # All hint responses

    # Consumer Group
    CONSUMER_GROUP_ID = 'hint-generator-normal-pool'


config = Config()