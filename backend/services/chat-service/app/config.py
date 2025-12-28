import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS')
    KAFKA_API_KEY = os.getenv('KAFKA_API_KEY')
    KAFKA_API_SECRET = os.getenv('KAFKA_API_SECRET')
    
    # Topics
    TOPIC_CHAT_EVENTS = 'chat.events'
    TOPIC_CHAT_RESPONSES = 'chat.responses'
    
    # Google
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    CONSUMER_GROUP_ID = 'chat-service-consumer'

config = Config()
