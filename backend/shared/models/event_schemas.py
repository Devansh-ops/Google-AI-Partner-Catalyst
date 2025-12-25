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