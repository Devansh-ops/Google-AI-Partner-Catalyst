from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum
from collections import deque


class Severity(Enum):
    """Severity levels for stuck patterns"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class CodeSnapshot:
    """Represents a snapshot of code at a point in time"""
    timestamp: str
    code: str
    code_length: int
    code_hash: str  # For detecting reverts


@dataclass
class TestRun:
    """Represents a single test execution"""
    timestamp: str
    status: str  # 'passed', 'failed', 'timeout', 'error'
    error_message: Optional[str] = None
    error_type: Optional[str] = None  # KeyError, IndexError, etc.
    test_case: Optional[str] = None


@dataclass
class HintRecord:
    """Record of a hint that was sent"""
    timestamp: str
    hint_level: int
    pattern_type: str
    hint_text: str
    was_helpful: Optional[bool] = None  # User feedback


@dataclass
class StuckPattern:
    """Detected stuck pattern"""
    pattern_type: str
    severity: Severity
    confidence: float  # 0.0 to 1.0
    specific_issue: str
    detected_at: str


class UserSessionState:
    """
    Maintains the complete state for a user session.
    This is stored as Flink keyed state.
    """

    def __init__(self, session_id: str, problem_id: str = None, problem_description: str = None):
        # Identity
        self.session_id = session_id
        self.problem_id = problem_id or "unknown"
        self.problem_description = problem_description or ""  # Cached problem description
        self.started_at = datetime.utcnow().isoformat()
        self.last_activity = datetime.utcnow().isoformat()

        # Code Evolution (CircularBuffer, max 10)
        self.code_snapshots: deque = deque(maxlen=10)

        # Test History (CircularBuffer, max 20)
        self.test_runs: deque = deque(maxlen=20)
        self.failure_patterns: Dict[str, int] = {}  # error_type -> count
        self.consecutive_failures = 0
        self.consecutive_timeouts = 0

        # Behavioral Signals
        self.time_idle_seconds = 0
        self.frustration_score = 0.0  # 0.0 to 1.0
        self.is_currently_typing = False
        self.last_code_change = None
        self.last_event_type = None  # Track most recent event type

        # Intervention State
        self.hints_sent: List[HintRecord] = []
        self.current_hint_level = 0  # 0-6
        self.last_hint_timestamp = None

        # User Preferences
        self.user_mode = 'mentor'  # mentor, on-demand, silent
        self.hint_effectiveness_score = 1.0  # 0.0 to 1.0

        # Detected Patterns
        self.active_patterns: List[StuckPattern] = []

    def update_code(self, code: str, timestamp: str):
        """Update code snapshot"""
        import hashlib
        code_hash = hashlib.md5(code.encode()).hexdigest()

        snapshot = CodeSnapshot(
            timestamp=timestamp,
            code=code,
            code_length=len(code),
            code_hash=code_hash
        )

        self.code_snapshots.append(snapshot)
        self.last_activity = timestamp
        self.last_code_change = timestamp
        self.is_currently_typing = True

        # Reset idle time
        self.time_idle_seconds = 0

    def update_test_result(self, status: str, timestamp: str,
                          error_message: Optional[str] = None):
        """Update test run history"""
        # Extract error type from error message
        error_type = None
        if error_message:
            if "KeyError" in error_message:
                error_type = "KeyError"
            elif "IndexError" in error_message:
                error_type = "IndexError"
            elif "ValueError" in error_message:
                error_type = "ValueError"
            elif "TypeError" in error_message:
                error_type = "TypeError"
            elif "AttributeError" in error_message:
                error_type = "AttributeError"
            elif "TimeoutError" in error_message or "timeout" in error_message.lower():
                error_type = "TimeoutError"
            else:
                error_type = "OtherError"

        test_run = TestRun(
            timestamp=timestamp,
            status=status,
            error_message=error_message,
            error_type=error_type
        )

        self.test_runs.append(test_run)
        self.last_activity = timestamp
        self.is_currently_typing = False

        # Update consecutive failures
        if status == 'failed':
            self.consecutive_failures += 1
            if error_type:
                self.failure_patterns[error_type] = \
                    self.failure_patterns.get(error_type, 0) + 1
        else:
            self.consecutive_failures = 0

        # Update consecutive timeouts
        if error_type == 'TimeoutError':
            self.consecutive_timeouts += 1
        else:
            self.consecutive_timeouts = 0

    def update_idle_time(self, seconds: int):
        """Update idle time"""
        self.time_idle_seconds = seconds
        self.is_currently_typing = False

    def add_hint(self, hint_record: HintRecord):
        """Record a hint that was sent"""
        self.hints_sent.append(hint_record)
        self.last_hint_timestamp = hint_record.timestamp
        self.current_hint_level = hint_record.hint_level

        # Keep only last 10 hints
        if len(self.hints_sent) > 10:
            self.hints_sent = self.hints_sent[-10:]

    def update_frustration_score(self):
        """Calculate frustration score based on multiple signals"""
        score = 0.0

        # Consecutive failures contribute
        if self.consecutive_failures >= 5:
            score += 0.4
        elif self.consecutive_failures >= 3:
            score += 0.2

        # Error diversity contributes
        error_types = len(self.failure_patterns.keys())
        if error_types >= 5:
            score += 0.3
        elif error_types >= 3:
            score += 0.15

        # Idle time contributes
        if self.time_idle_seconds >= 300:  # 5 minutes
            score += 0.3
        elif self.time_idle_seconds >= 180:  # 3 minutes
            score += 0.15

        self.frustration_score = min(1.0, score)

    def get_recent_test_runs(self, count: int = 5) -> List[TestRun]:
        """Get most recent test runs"""
        return list(self.test_runs)[-count:]

    def get_recent_code_snapshots(self, count: int = 5) -> List[CodeSnapshot]:
        """Get most recent code snapshots"""
        return list(self.code_snapshots)[-count:]

    def has_code_reverted(self) -> bool:
        """Check if code has reverted to a previous version"""
        if len(self.code_snapshots) < 3:
            return False

        # Check if latest code hash matches any previous hash
        latest_hash = self.code_snapshots[-1].code_hash
        for snapshot in list(self.code_snapshots)[:-1]:
            if snapshot.code_hash == latest_hash:
                return True
        return False

    def to_dict(self) -> dict:
        """Convert state to dictionary for serialization"""
        return {
            'session_id': self.session_id,
            'problem_id': self.problem_id,
            'problem_description': self.problem_description,
            'started_at': self.started_at,
            'last_activity': self.last_activity,
            'code_snapshots': [
                {
                    'timestamp': s.timestamp,
                    'code': s.code,
                    'code_length': s.code_length,
                    'code_hash': s.code_hash
                }
                for s in self.code_snapshots
            ],
            'test_runs': [
                {
                    'timestamp': t.timestamp,
                    'status': t.status,
                    'error_message': t.error_message,
                    'error_type': t.error_type
                }
                for t in self.test_runs
            ],
            'failure_patterns': self.failure_patterns,
            'consecutive_failures': self.consecutive_failures,
            'consecutive_timeouts': self.consecutive_timeouts,
            'time_idle_seconds': self.time_idle_seconds,
            'frustration_score': self.frustration_score,
            'hints_sent': [
                {
                    'timestamp': h.timestamp,
                    'hint_level': h.hint_level,
                    'pattern_type': h.pattern_type,
                    'hint_text': h.hint_text
                }
                for h in self.hints_sent
            ],
            'current_hint_level': self.current_hint_level,
            'last_hint_timestamp': self.last_hint_timestamp,
            'user_mode': self.user_mode
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'UserSessionState':
        """Create state from dictionary"""
        state = cls(
            session_id=data['session_id'],
            problem_id=data.get('problem_id', 'unknown'),
            problem_description=data.get('problem_description', '')
        )

        state.started_at = data['started_at']
        state.last_activity = data['last_activity']

        # Restore code snapshots
        for s in data.get('code_snapshots', []):
            state.code_snapshots.append(CodeSnapshot(**s))

        # Restore test runs
        for t in data.get('test_runs', []):
            state.test_runs.append(TestRun(**t))

        state.failure_patterns = data.get('failure_patterns', {})
        state.consecutive_failures = data.get('consecutive_failures', 0)
        state.consecutive_timeouts = data.get('consecutive_timeouts', 0)
        state.time_idle_seconds = data.get('time_idle_seconds', 0)
        state.frustration_score = data.get('frustration_score', 0.0)

        # Restore hints
        for h in data.get('hints_sent', []):
            state.hints_sent.append(HintRecord(**h))

        state.current_hint_level = data.get('current_hint_level', 0)
        state.last_hint_timestamp = data.get('last_hint_timestamp')
        state.user_mode = data.get('user_mode', 'mentor')

        return state
