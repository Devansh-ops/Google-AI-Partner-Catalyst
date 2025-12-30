from pydantic import BaseModel
from typing import Optional


class CodeChangeEvent(BaseModel):
    """
    Event schema for Frontend → API Gateway → Kafka (events.realtime topic).

    Event Types (5 total):
    - 'CODE_CHANGE': User modified their code
    - 'TAB_SWITCH': User switched tabs (left/returned to problem)
    - 'HINT_REQUEST': User clicked "Get Hint" button
    - 'TEST_RUN': User ran tests locally
    - 'GIVE_UP': User clicked "I give up" or "Show Solution"
    """
    event_type: str  # One of: CODE_CHANGE, TAB_SWITCH, HINT_REQUEST, TEST_RUN, GIVE_UP
    timestamp: str
    session_id: Optional[str] = None
    code: Optional[str] = None

    # Problem info
    problem_title: Optional[str] = None  # e.g., "Two Sum"
    problem_description: Optional[str] = None  # Full problem description

    # Test results (for TEST_RUN events only)
    test_status: Optional[str] = None  # 'success', 'failed', 'timeout'
    error_message: Optional[str] = None  # Error details if failed


class HintResponse(BaseModel):
    """
    Response schema for Hint Generator → API Gateway → Frontend.

    Published to hints.responses topic.
    """
    type: str = "hint"
    session_id: str
    hint: str
    timestamp: str


# ============================================================================
# MESSAGE SCHEMAS (Documentation Only - Not Validated)
# ============================================================================
#
# The following schemas are for documentation purposes to show the structure
# of messages flowing through the system. They are NOT enforced with Pydantic
# validation for performance reasons in the Flink streaming pipeline.
#
# ============================================================================
# Flink → Hint Generator (hints.requests.normal topic)
# ============================================================================
#
# {
#     "session_id": str,
#     "problem_id": str,
#     "timestamp": str,
#     "event_type": "hint_request",
#
#     "stuck_pattern": {
#         "type": str,              # e.g., "test_failure_loop"
#         "severity": str,          # "LOW", "MEDIUM", "HIGH", "CRITICAL"
#         "confidence": float,      # 0.0 to 1.0
#         "issue": str              # Human-readable description
#     },
#
#     "current_code": str,
#
#     "code_history": [
#         {
#             "timestamp": str,
#             "code": str,
#             "code_length": int
#         }
#     ],
#
#     "test_history": [
#         {
#             "timestamp": str,
#             "status": str,        # "passed", "failed", "timeout", "error"
#             "error_type": str,    # "KeyError", "IndexError", etc.
#             "error_message": str
#         }
#     ],
#
#     "failure_patterns": {
#         "KeyError": 3,            # error_type -> count
#         "IndexError": 1
#     },
#
#     "consecutive_failures": int,
#
#     "behavioral_signals": {
#         "time_idle_seconds": int,
#         "frustration_score": float,  # 0.0 to 1.0
#         "has_reverted_code": bool
#     },
#
#     "previous_hints": [
#         {
#             "timestamp": str,
#             "level": int,         # 1-6
#             "pattern": str,
#             "hint": str
#         }
#     ],
#
#     "hint_level": int,            # 1-6 (progressively more direct)
#     "user_mode": str              # "mentor", "on-demand", "silent"
# }
#
# ============================================================================
