import json
import uuid
import time
import sys
import os
from confluent_kafka import Producer, Consumer
from dotenv import load_dotenv

# Load .env from backend root
env_path = os.path.join(os.path.dirname(__file__), '../../../.env')
load_dotenv(env_path)


# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../'))

from shared.config.kafka_config import get_producer_config, get_consumer_config

def test_chat_flow():
    session_id = f"test-session-{uuid.uuid4()}"
    print(f"Starting test chat flow for session: {session_id}")
    
    # 1. Setup Producer and Consumer
    producer = Producer(get_producer_config())
    consumer = Consumer({
        **get_consumer_config(f'test-consumer-{uuid.uuid4()}'), 
        'auto.offset.reset': 'latest'
    })
    
    topic_events = 'chat.events'
    topic_responses = 'chat.responses'
    
    consumer.subscribe([topic_responses])
    
    # 2. Simulate Chat Event
    chat_event = {
        'event_type': 'chat_message',
        'message': 'I am struggling with the time complexity of my Two Sum solution. Any tips?',
        'session_id': session_id,
        'timestamp': str(time.time()),
        'problem_context': {
            'title': 'Two Sum',
            'description': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            'difficulty': 'Easy',
            'url': 'https://leetcode.com/problems/two-sum/'
        },
        'current_code': 'def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if i != j and nums[i] + nums[j] == target:\n                return [i, j]',
        'previous_hints': []
    }
    
    print("\n[Producer] Sending chat message...")
    producer.produce(
        topic=topic_events,
        value=json.dumps(chat_event),
        key=session_id
    )
    producer.flush()
    
    # 3. Wait for Response
    print("[Consumer] Waiting for response...")
    start_time = time.time()
    while time.time() - start_time < 30: # 30s timeout
        msg = consumer.poll(1.0)
        
        if msg is None:
            continue
            
        if msg.error():
            print(f"Consumer error: {msg.error()}")
            continue
            
        data = json.loads(msg.value().decode('utf-8'))
        
        if data.get('session_id') == session_id:
            print("\n[Success] Received response!")
            print(f"Agent Response: {data.get('message')}")
            break
            
    consumer.close()

if __name__ == "__main__":
    test_chat_flow()
