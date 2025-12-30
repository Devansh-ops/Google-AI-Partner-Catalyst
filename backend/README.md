# LeetCode Mentor - Backend

Simplified 5-event architecture for LeetCode AI mentoring.

## Architecture

```
Frontend (WebSocket) → API Gateway → Kafka (events.realtime) → Pattern Processor
                           ↑                                           ↓
                           |                                    (message_for routing)
                           |                                           ↓
                           |                              Kafka (events.realtime) → Hint Generator
                           |                                                              ↓
                           |                                                         Gemini API
                           |                                                              ↓
                           └─────────────────────── Kafka (hints.responses) ──────────────┘
```

### Message Flow

1. **Frontend → API Gateway**: WebSocket connection sends events
2. **API Gateway → events.realtime**: All events tagged with `message_for: 'pattern-processor'`
3. **Pattern Processor**: Filters by `message_for == 'pattern-processor'`, processes 5 event types:
   - **CODE_CHANGE**: Checks for 3+ line changes using difflib, forwards significant changes
   - **TAB_SWITCH**: Makes direct HTTP POST to hint-generator:8080 (bypass queue)
   - **HINT_REQUEST**: Collects last 5 iterations, forwards with context
   - **TEST_RUN**: Forwards test results (success/failed/timeout)
   - **GIVE_UP**: Forwards request for full solution
4. **Pattern Processor → events.realtime**: Forwards processed events tagged with `message_for: 'hint-generator'`
5. **Hint Generator**: Filters by `message_for == 'hint-generator'`, generates hints via Gemini
6. **Hint Generator → hints.responses**: Sends hints back via Kafka
7. **API Gateway → Frontend**: Delivers hints via WebSocket

### Event Types (5 Total)

| Event Type | Trigger | Pattern Processor Action | Hint Generator Response |
|------------|---------|--------------------------|-------------------------|
| CODE_CHANGE | User makes 3+ line changes | Diff analysis, forwards if significant | Compare prev/current code, give feedback |
| TAB_SWITCH | User switches browser tabs | HTTP POST to hint-generator | Quick encouragement message |
| HINT_REQUEST | User clicks "Get Hint" | Collect last 5 iterations | Analyze progress, targeted hint |
| TEST_RUN | User runs tests | Forward test results | Success: optimization tips, Failed: debug help |
| GIVE_UP | User clicks "Give Up" | Forward request | 3 solutions: brute force, good, best |

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

1. Start services: `docker-compose up --build`
2. Open [test-frontend/test.html](../test-frontend/test.html) in browser
3. Connect to WebSocket at `ws://localhost:8000/ws/test-session-123`
4. Test all 5 event types:
   - **Code Change**: Modify code (3+ lines), click "Code Change"
   - **Tab Switch**: Click "Tab Switch" to get encouragement
   - **Hint Request**: Click "Request Hint" for targeted help
   - **Test Run**: Select test status, click "Test Run"
   - **Give Up**: Click "Give Up" for full solution with 3 approaches
5. Watch hints appear in the frontend

## Project Structure
```
backend/
├── services/
│   ├── api-gateway/           # WebSocket server + Kafka producer
│   ├── pattern-processor/     # Event pattern detection & routing
│   └── hint-generator/        # Kafka consumer + Gemini API + HTTP server
│       └── normal-pool/       # Main hint generation service
├── shared/                    # Shared Kafka services and utilities
├── deployment/                # K8s configs and scripts
├── docker-compose.yml         # Local development
└── .env                       # Kafka + Google Cloud credentials
```

## Key Components

### API Gateway
- **Port**: 8000
- **Purpose**: WebSocket server for real-time frontend communication
- **Role**: Accepts events from frontend, adds `message_for: 'pattern-processor'` routing tag, publishes to Kafka

### Pattern Processor
- **Purpose**: Intelligent event filtering and routing
- **Filters**: Only processes `message_for == 'pattern-processor'`
- **Actions**:
  - CODE_CHANGE: Detects 3+ line changes via difflib
  - TAB_SWITCH: Direct HTTP POST to hint-generator (no queue)
  - HINT_REQUEST: Collects last 5 test iterations
  - TEST_RUN: Validates test status
  - GIVE_UP: Passes through
- **Forwards**: Adds `message_for: 'hint-generator'` tag to outgoing events

### Hint Generator
- **Port**: 8080 (HTTP server for TAB_SWITCH)
- **Purpose**: AI hint generation via Gemini
- **Dual Interface**:
  1. Kafka consumer (for CODE_CHANGE, HINT_REQUEST, TEST_RUN, GIVE_UP)
  2. HTTP server (for TAB_SWITCH direct calls)
- **Filters**: Only processes `message_for == 'hint-generator'`
- **Output**: Custom prompts per event type, responses to hints.responses topic

## Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| events.realtime | api-gateway, pattern-processor | pattern-processor, hint-generator | All events (routed by message_for field) |
| hints.responses | hint-generator | api-gateway | AI-generated hints back to frontend |