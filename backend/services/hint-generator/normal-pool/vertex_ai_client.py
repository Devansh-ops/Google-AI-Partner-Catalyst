import logging
import vertexai
from vertexai.preview.generative_models import GenerativeModel
from config import config

logger = logging.getLogger(__name__)


class VertexAIClient:
    def __init__(self):
        # Initialize Vertex AI
        vertexai.init(
            project=config.GOOGLE_CLOUD_PROJECT,
            location=config.VERTEX_AI_LOCATION
        )
        self.model = GenerativeModel(config.VERTEX_AI_MODEL)
        logger.info(f"Vertex AI initialized with model {config.VERTEX_AI_MODEL}")
    
    def generate_hint(self, prompt: str) -> str:
        """Generate hint using Gemini"""
        try:
            logger.info("Calling Gemini API...")
            
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "top_k": 40,
                    "max_output_tokens": 200,
                }
            )
            
            hint_text = response.text.strip()
            logger.info(f"Gemini response received: {hint_text[:100]}...")
            
            # Validate hint quality
            if len(hint_text) < 20:
                logger.warning("Hint too short, using fallback")
                return self._get_fallback_hint()
            
            if "def " in hint_text or "function" in hint_text.lower():
                logger.warning("Hint contains code, regenerating...")
                # Try again with stricter instruction
                prompt += "\n\nIMPORTANT: Do NOT write any code. Only provide conceptual guidance in 2-3 sentences."
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 200,
                    }
                )
                hint_text = response.text.strip()
            
            return hint_text
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._get_fallback_hint()
    
    def _get_fallback_hint(self) -> str:
        """Fallback hint when API fails"""
        return "Take a moment to review your approach. Consider the problem constraints and whether your current solution handles all edge cases."


def build_prompt(event: dict) -> str:
    """Build prompt for Gemini based on event"""
    event_type = event.get('event_type', 'unknown')
    code = event.get('code', '')
    problem_title = event.get('problem_title', 'a coding problem')
    error_message = event.get('error_message', '')
    is_correct = event.get('is_correct', False)
    test_status = event.get('test_status', 'unknown')

    # Handle correct solutions
    if is_correct or test_status == 'passed' or (event_type == 'test_result' and not error_message):
        prompt = f"""You are a helpful coding mentor. A user just successfully solved "{problem_title}"!

Their working code:
```
{code}
```

Provide a brief, enthusiastic congratulatory message (1-2 sentences) celebrating their success. Be genuine and encouraging. Do NOT suggest improvements or ask them to optimize - they've solved it correctly!
"""
    # Handle test failures with error messages
    elif event_type == 'test_result' and error_message:
        prompt = f"""You are a helpful coding mentor. A user is solving "{problem_title}" and encountered an error.

Their code:
```
{code}
```

Error message:
{error_message}

Provide a brief, encouraging hint (2-3 sentences) that guides them toward fixing the issue WITHOUT giving them the complete solution. Focus on helping them understand what went wrong and point them in the right direction.
"""
    # Handle general progress/working state
    else:
        prompt = f"""You are a helpful coding mentor. A user is working on "{problem_title}".

Their current code:
```
{code}
```

Provide a brief, encouraging hint (1-2 sentences) to help them make progress. Be supportive and guide them without giving away the solution.
"""

    return prompt