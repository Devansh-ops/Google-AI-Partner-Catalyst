# LeetCode Mentor - Backend

Minimal working setup for testing the complete flow.

## Architecture
```
Frontend (WebSocket) → API Gateway → Kafka → Hint Generator → Gemini
                           ↑                        ↓
                           └────────────────────────┘
```

## Quick Start

### 1. Setup Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
# - Confluent Cloud Kafka credentials
# - Google Cloud project ID
# - Place vertex-ai-key.json in backend/
```

### 2. Local Development
```bash
# Install dependencies for both services
cd services/api-gateway
pip install -r requirements.txt
cd ../hint-generator/normal-pool
pip install -r requirements.txt
cd ../../..

# Run API Gateway
cd services/api-gateway
python main.py

# In another terminal, run Hint Generator
cd services/hint-generator/normal-pool
python main.py
```

### 3. Docker Compose
```bash
# Build and run all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Deploy to GKE
```bash
# Setup Kafka topics
cd deployment/scripts
chmod +x setup_kafka_topics.sh
./setup_kafka_topics.sh

# Deploy to GKE
chmod +x deploy_services.sh
# Edit deploy_services.sh with your PROJECT_ID first
./deploy_services.sh
```

## Testing

1. Open `frontend/test.html` in browser
2. Connect to WebSocket
3. Send test event
4. Wait for AI hint response

## Project Structure
```
backend/
├── services/
│   ├── api-gateway/       # WebSocket + Kafka producer
│   └── hint-generator/    # Kafka consumer + Gemini
├── shared/                # Shared models and utilities
├── deployment/            # K8s configs and scripts
└── docker-compose.yml     # Local development
```