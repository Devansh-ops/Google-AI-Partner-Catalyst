"""
HTTP Server for Hint Generator
Handles direct TAB_SWITCH requests from pattern-processor
"""
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from vertex_ai_client import VertexAIClient, build_tab_switch_prompt
from shared.services import KafkaProducerService
from config import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Hint Generator HTTP Server")

# Initialize services
vertex_ai = VertexAIClient()
producer = KafkaProducerService(client_id='hint-generator-http-producer')


class TabSwitchRequest(BaseModel):
    """Request model for TAB_SWITCH events"""
    event_type: str
    session_id: str
    timestamp: str
    problem_title: Optional[str] = None
    current_code: Optional[str] = ""


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "hint-generator-http"}


@app.post("/generate-hint")
async def generate_hint(request: TabSwitchRequest):
    """
    Generate hint for TAB_SWITCH event
    This is called directly by pattern-processor for immediate response
    """
    try:
        logger.info(f"Received TAB_SWITCH request for session {request.session_id}")

        # Build prompt for TAB_SWITCH
        event_data = request.dict()
        prompt = build_tab_switch_prompt(event_data)

        # Generate hint (short response - 200 tokens)
        hint_text = vertex_ai.generate_hint_with_tokens(prompt, max_tokens=200)

        # Build hint response
        hint_response = {
            'type': 'hint',
            'session_id': request.session_id,
            'hint': hint_text,
            'timestamp': request.timestamp,
            'event_type': 'TAB_SWITCH'
        }

        # Send to hints.responses topic
        producer.send_event(
            topic=config.TOPIC_HINTS_RESPONSES,
            session_id=request.session_id,
            event_data=hint_response
        )

        logger.info(f"TAB_SWITCH hint sent for session {request.session_id}")

        return {
            "status": "success",
            "message": "Hint generated and sent to hints.responses",
            "hint": hint_text
        }

    except Exception as e:
        logger.error(f"Error generating hint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")