import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected: {session_id} (Total: {len(self.active_connections)})")
    
    def disconnect(self, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected: {session_id} (Total: {len(self.active_connections)})")
    
    async def send_message(self, session_id: str, message: dict):
        """Send message to specific WebSocket"""
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_json(message)
                logger.info(f"Message sent to {session_id}")
            except Exception as e:
                logger.error(f"Failed to send message to {session_id}: {e}")
                self.disconnect(session_id)
        else:
            logger.warning(f"No active WebSocket for session {session_id}")
    
    def get_connection(self, session_id: str) -> WebSocket:
        """Get WebSocket connection for session"""
        return self.active_connections.get(session_id)