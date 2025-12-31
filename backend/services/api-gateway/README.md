# 🚪 API Gateway Service

The **API Gateway** is the entry point for the LeetCode Mentor backend. It manages real-time WebSocket connections with the frontend extension and acts as the bridge to the event-driven Kafka architecture.

## 🔑 Key Responsibilities

1.  **WebSocket Management**: Maintains persistent connections with the client extension.
2.  **Event Ingestion**: Receives `code_change`, `test_run`, and `hint_request` events from the client and produces them to the `raw-topics` Kafka topic.
3.  **Response Routing**: Consumes processed hints and chat responses from Kafka and routes them back to the specific connected client via their WebSocket session.
4.  **Traffic Control**: Lightweight and stateless (except for connection map), allowing for easy horizontal scaling.

## 🛠 Stack

*   **Framework**: FastAPI (Python)
*   **Communication**: WebSockets, Kafka Producer/Consumer

## 🚀 Running Locally

```bash
# Navigate to directory
cd backend/services/api-gateway

# Install dependencies (if not using Docker)
pip install -r requirements.txt

# Run server
uvicorn main:app --port 8080 --reload
```
