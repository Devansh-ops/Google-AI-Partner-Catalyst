from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import logging
from chatbot import ChatBot

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chat Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "chat-service"}

@app.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    chat_bot = ChatBot()
    
    try:
        # Wait for initialization message
        # Expected format: { "type": "init", "problem": "...", "code": "...", "hints": [...] }
        init_data = await websocket.receive_json()
        
        if init_data.get("type") != "init":
            await websocket.send_json({"type": "error", "message": "Expected init message"})
            await websocket.close()
            return
            
        problem = init_data.get("problem")
        code = init_data.get("code")
        hints = init_data.get("hints", [])
        
        chat_bot.start_session(problem_stmt=problem, current_code=code, hints=hints)
        
        await websocket.send_json({"type": "status", "message": "Chat session initialized", "ready": True})
        
        # Chat loop
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                user_msg = data.get("content")
                if not user_msg:
                    continue
                    
                response = chat_bot.send_message(user_msg)
                
                await websocket.send_json({
                    "type": "response",
                    "content": response
                })
            elif data.get("type") == "ping":
                 await websocket.send_json({"type": "pong"})
            
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error in chat session: {e}")
        try:
           await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
