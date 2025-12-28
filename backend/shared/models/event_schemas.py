from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CodeChangeEvent(BaseModel):
    event_type: str
    timestamp: str
    session_id: Optional[str] = None
    problem_title: str
    code: str
    error_message: Optional[str] = None
    status: Optional[str] = None
    is_correct: Optional[bool] = None  # Whether the solution is correct
    test_status: Optional[str] = None  # 'passed', 'failed', 'unknown'


class HintResponse(BaseModel):
    type: str = "hint"
    session_id: str
    hint: str
    timestamp: str


class ChatMessageEvent(BaseModel):
    event_type: str = "chat_message"
    message: str
    session_id: str
    timestamp: str
    problem_context: Optional[dict] = None # title, description, url, difficulty
    current_code: Optional[str] = None
    previous_hints: Optional[list] = None


class ChatResponseEvent(BaseModel):
    type: str = "chat_response"
    session_id: str
    message: str
    timestamp: str