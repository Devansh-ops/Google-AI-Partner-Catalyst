import asyncio
import logging
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from confluent_kafka import Consumer, KafkaException
import sys
import os

# Add shared to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from config import config
from websocket_manager import WebSocketManager
from kafka_producer import KafkaProducerService
from shared.config.kafka_config import get_consumer_config
from shared.models.event_schemas import CodeChangeEvent

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI with enhanced OpenAPI documentation
app = FastAPI(
    title="LeetCode Mentor API Gateway",
    description="""
    🧠 **LeetCode AI Mentor API Gateway**

    Real-time WebSocket-based API for providing AI-powered coding hints and mentorship.

    ## Features

    * **WebSocket Connection** - Real-time bidirectional communication
    * **Event Processing** - Handle code changes and test results
    * **AI Hints** - Receive intelligent hints from Gemini AI
    * **Kafka Integration** - Event-driven architecture

    ## WebSocket Events

    ### Sent by Client:
    - `code_change` - User modified their code
    - `test_result` - User ran tests (passed/failed)

    ### Received by Client:
    - `hint` - AI-generated hint from Gemini
    - `ack` - Event acknowledgment
    - `error` - Error message
    """,
    version="1.0.0",
    contact={
        "name": "LeetCode Mentor Team",
    },
    license_info={
        "name": "MIT",
    },
)

# CORS for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ws_manager = WebSocketManager()
kafka_producer = KafkaProducerService()


@app.get("/",
    summary="Root endpoint",
    description="Get basic API information and status",
    tags=["General"],
    response_description="API status and version information"
)
async def root():
    """
    Returns basic information about the API Gateway.

    Use this endpoint to verify the service is running.
    """
    return {
        "status": "ok",
        "service": "API Gateway",
        "version": "1.0.0"
    }


@app.get("/health",
    summary="Health check",
    description="Check API health and active WebSocket connections",
    tags=["General"],
    response_description="Health status and connection count"
)
async def health():
    """
    Health check endpoint for monitoring.

    Returns:
    - status: Current health status
    - active_connections: Number of active WebSocket connections
    """
    return {
        "status": "healthy",
        "active_connections": len(ws_manager.active_connections)
    }


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time client connections.

    **Parameters:**
    - `session_id`: Unique identifier for the user session

    **Client → Server Events:**
    ```json
    {
        "event_type": "code_change",
        "timestamp": "2025-01-01T12:00:00Z",
        "problem_title": "Two Sum",
        "code": "def solution()...",
        "is_correct": false,
        "test_status": "unknown"
    }
    ```

    **Server → Client Responses:**
    ```json
    {
        "type": "hint",
        "session_id": "session-123",
        "hint": "Try using a hash map...",
        "timestamp": "2025-01-01T12:00:01Z"
    }
    ```
    """
    await ws_manager.connect(session_id, websocket)
    
    try:
        while True:
            # Receive event from frontend
            data = await websocket.receive_json()
            logger.info(f"Received event from {session_id}: {data.get('event_type')}")
            
            # Add session_id to event
            data['session_id'] = session_id
            
            # Validate event (basic validation)
            try:
                event = CodeChangeEvent(**data)
            except Exception as e:
                logger.error(f"Invalid event format: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid event format"
                })
                continue
            
            # Send to Kafka
            kafka_producer.send_event(
                topic=config.TOPIC_EVENTS_REALTIME,
                session_id=session_id,
                event_data=data
            )
            
            # Acknowledge receipt
            await websocket.send_json({
                "type": "ack",
                "message": "Event received and queued for processing"
            })
            
    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {session_id}")
        ws_manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error for {session_id}: {e}")
        ws_manager.disconnect(session_id)


async def consume_hints_from_kafka():
    """Background task to consume hints from Kafka and deliver via WebSocket"""
    consumer = Consumer(get_consumer_config('api-gateway-hint-consumer'))
    consumer.subscribe([config.TOPIC_HINTS_RESPONSES])
    
    logger.info("Started consuming hints from Kafka...")
    
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            
            if msg is None:
                await asyncio.sleep(0.1)
                continue
            
            if msg.error():
                logger.error(f"Consumer error: {msg.error()}")
                continue
            
            # Parse hint response
            hint_data = json.loads(msg.value().decode('utf-8'))
            session_id = hint_data.get('session_id')
            
            logger.info(f"Received hint for session {session_id}")
            
            # Send to WebSocket
            await ws_manager.send_message(session_id, hint_data)
            
            await asyncio.sleep(0.1)
            
    except Exception as e:
        logger.error(f"Kafka consumer error: {e}")
    finally:
        consumer.close()


@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    asyncio.create_task(consume_hints_from_kafka())
    logger.info("API Gateway started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    kafka_producer.close()
    logger.info("API Gateway shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info"
    )