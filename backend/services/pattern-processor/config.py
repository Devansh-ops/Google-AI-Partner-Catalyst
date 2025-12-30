import os
from dotenv import load_dotenv

load_dotenv()


class ProcessorConfig:
    # Kafka Configuration
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS')
    KAFKA_API_KEY = os.getenv('KAFKA_API_KEY')
    KAFKA_API_SECRET = os.getenv('KAFKA_API_SECRET')

    # Kafka Topics - Using two topics to minimize EKCU costs
    TOPIC_EVENTS = 'events.realtime'  # All incoming events
    TOPIC_HINTS_RESPONSES = 'hints.responses'  # All hint responses

    # State Management
    STATE_DIR = os.getenv('PROCESSOR_STATE_DIR', '/app/state')
    CHECKPOINT_INTERVAL_SECONDS = int(os.getenv('CHECKPOINT_INTERVAL_SECONDS', '30'))

    # Pattern Detection Thresholds (same as Flink config)
    TEST_FAILURE_THRESHOLD = 3
    IDLE_TIME_THRESHOLD = 180
    CODE_THRASHING_THRESHOLD = 2
    ERROR_DIVERSITY_THRESHOLD = 5
    TIMEOUT_THRESHOLD = 3

    # Intervention Rules
    MIN_HINT_COOLDOWN_SECONDS = 120
    MIN_CONFIDENCE_THRESHOLD = 0.7
    MIN_SEVERITY = 'MEDIUM'

    # User Modes
    USER_MODE_MENTOR = 'mentor'
    USER_MODE_ON_DEMAND = 'on-demand'
    USER_MODE_SILENT = 'silent'