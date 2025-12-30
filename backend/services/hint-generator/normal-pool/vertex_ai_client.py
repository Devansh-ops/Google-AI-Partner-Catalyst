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

    def generate_hint_with_tokens(self, prompt: str, max_tokens: int = 200) -> str:
        """Generate hint using Gemini with custom token limit

        Args:
            prompt: The prompt to send to Gemini
            max_tokens: Maximum number of output tokens
        """
        try:
            logger.info(f"Calling Gemini API with max_tokens={max_tokens}...")

            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "top_k": 40,
                    "max_output_tokens": max_tokens,
                }
            )

            hint_text = response.text.strip()
            logger.info(f"Gemini response received: {hint_text[:100]}...")

            # Validate hint quality
            if len(hint_text) < 20:
                logger.warning("Hint too short, using fallback")
                return self._get_fallback_hint()

            return hint_text

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._get_fallback_hint()

    def _get_fallback_hint(self) -> str:
        """Fallback hint when API fails"""
        return "Take a moment to review your approach. Consider the problem constraints and whether your current solution handles all edge cases."


def get_style_instructions(event: dict) -> str:
    """Generate style instructions based on user preferences"""
    tone = event.get('tone', 'Supportive')
    level = event.get('experience_level', 'Beginner')

    style_guide = f"\n**User Profile:**\n- Tone Preference: {tone}\n- Experience Level: {level}\n"

    # Tone instructions
    if str(tone).lower() == 'rude':
        style_guide += "- Act like a brilliant but impatient senior engineer. Be blunt, sarcastic, and slightly annoyed by mistakes. Don't sugarcoat.\n"
    else:
        style_guide += "- Be an encouraging, patient, and positive mentor.\n"

    # Level instructions
    if str(level).lower() == 'advanced':
        style_guide += "- Assume deep technical knowledge. Be concise. Focus on edge cases, optimization, and system design implications. Skip the basics.\n"
    elif str(level).lower() == 'intermediate':
        style_guide += "- Assume standard competence. Explain complex logic but skip basic syntax explanations.\n"
    else:  # Beginner
        style_guide += "- Explain concepts simply and clearly. Avoid unnecessary jargon. Break down complex steps.\n"

    return style_guide


def build_prompt(event: dict) -> str:
    """Build prompt for Gemini based on event type

    Handles 5 event types:
    - CODE_CHANGE: Compare previous/current code and suggest improvements
    - TAB_SWITCH: Quick encouragement when user switches tabs
    - HINT_REQUEST: Analyze multiple iterations and provide targeted hint
    - TEST_RUN: Check test status and provide appropriate feedback
    - GIVE_UP: Provide full solution with brute force, good, and best approaches
    """
    event_type = event.get('event_type', 'unknown')

    # Route to appropriate prompt builder
    if event_type == 'CODE_CHANGE':
        return build_code_change_prompt(event)
    elif event_type == 'TAB_SWITCH':
        return build_tab_switch_prompt(event)
    elif event_type == 'HINT_REQUEST':
        return build_hint_request_prompt(event)
    elif event_type == 'TEST_RUN':
        return build_test_run_prompt(event)
    elif event_type == 'GIVE_UP':
        return build_give_up_prompt(event)
    else:
        logger.warning(f"Unknown event type: {event_type}")
        return build_fallback_prompt(event)


def build_fallback_prompt(event: dict) -> str:
    """Fallback prompt for unknown event types"""
    code = event.get('code', event.get('current_code', ''))
    problem_title = event.get('problem_title', 'a coding problem')

    prompt = f"""You are a helpful coding mentor. A user is working on "{problem_title}".

Their current code:
```
{code}
```

Provide a brief, encouraging hint (1-2 sentences) to help them make progress. Be supportive and guide them without giving away the solution.
"""

    return prompt


def build_code_change_prompt(event: dict) -> str:
    """Build prompt for CODE_CHANGE event - compare previous and current code"""
    problem_title = event.get('problem_title', 'a coding problem')
    problem_description = event.get('problem_description', '')
    previous_code = event.get('previous_code', '')
    current_code = event.get('current_code', '')

    style_instructions = get_style_instructions(event)
    prompt = f"""You are an expert coding mentor acting according to the following profile:
{style_instructions}

A student is working on "{problem_title}" and just made significant changes to their code.

**Problem:**
{problem_description}

**Previous Code:**
```
{previous_code}
```

**Current Code:**
```
{current_code}
```

**Instructions:**
- Analyze what changed between the two versions
- If the change is moving in the right direction, provide brief encouragement (1-2 sentences)
- If the change introduces issues or moves away from the solution, provide a gentle hint (2-3 sentences)
- Do NOT provide code - only conceptual guidance
- Be supportive and constructive

Provide your feedback:"""

    return prompt


def build_tab_switch_prompt(event: dict) -> str:
    """Build prompt for TAB_SWITCH event - quick encouragement"""
    problem_title = event.get('problem_title', 'a coding problem')
    current_code = event.get('current_code', '')

    style_instructions = get_style_instructions(event)
    prompt = f"""You are a coding mentor acting according to the following profile:
{style_instructions}

A student working on "{problem_title}" just switched tabs, possibly to search for help.

**Their Current Code:**
```
{current_code}
```

**Instructions:**
- Provide a brief, encouraging message (1-2 sentences)
- Gently remind them that solving it themselves builds stronger skills
- Be supportive, not preachy
- Don't provide specific hints about the problem

Provide your encouragement:"""

    return prompt


def build_hint_request_prompt(event: dict) -> str:
    """Build prompt for HINT_REQUEST event - analyze multiple iterations"""
    problem_title = event.get('problem_title', 'a coding problem')
    problem_description = event.get('problem_description', '')
    current_code = event.get('current_code', '')
    iterations = event.get('iterations', [])

    # Build iteration history string
    iteration_str = ""
    for i, iteration in enumerate(iterations, 1):
        test_status = iteration.get('test_status', 'unknown')
        error_message = iteration.get('error_message', 'N/A')
        iteration_str += f"\n**Iteration {i}:**\n"
        iteration_str += f"- Test Status: {test_status}\n"
        if error_message and error_message != 'N/A':
            iteration_str += f"- Error: {error_message}\n"

    style_instructions = get_style_instructions(event)
    prompt = f"""You are an expert coding mentor acting according to the following profile:
{style_instructions}

A student is stuck on "{problem_title}" and requested a hint.

**Problem:**
{problem_description}

**Their Progress (Last {len(iterations)} iterations):**
{iteration_str}

**Current Code:**
```
{current_code}
```

**Instructions:**
- Analyze their iterations to understand what they've tried
- Identify the pattern in their mistakes or stuck point
- Provide a helpful hint (2-3 sentences) that guides them forward
- Do NOT give the complete solution
- Focus on the key insight they're missing

Provide your hint:"""

    return prompt


def build_test_run_prompt(event: dict) -> str:
    """Build prompt for TEST_RUN event - provide feedback based on test results"""
    problem_title = event.get('problem_title', 'a coding problem')
    problem_description = event.get('problem_description', '')
    code = event.get('code', '')
    test_status = event.get('test_status', 'unknown')
    error_message = event.get('error_message', '')

    style_instructions = get_style_instructions(event)

    if test_status == 'success':
        # Tests passed - check for optimization
        prompt = f"""You are an expert coding mentor acting according to the following profile:
{style_instructions}

A student just successfully solved "{problem_title}"!

**Problem:**
{problem_description}

**Their Working Code:**
```
{code}
```

**Instructions:**
- Start with genuine congratulations (1 sentence)
- Quickly analyze if the code is optimized (time/space complexity)
- If optimization is possible, provide a brief hint (1-2 sentences) about what could be improved
- If already optimal, just congratulate them enthusiastically
- Be encouraging and positive

Provide your feedback:"""
    else:
        # Tests failed - help debug
        prompt = f"""You are an expert coding mentor acting according to the following profile:
{style_instructions}

A student is solving "{problem_title}" and their tests failed.

**Problem:**
{problem_description}

**Their Code:**
```
{code}
```

**Test Status:** {test_status}
**Error Message:**
{error_message}

**Instructions:**
- Analyze where the code is failing based on the error
- Provide a helpful hint (2-3 sentences) on where they're going wrong
- Point them toward the correction WITHOUT giving the solution
- Be encouraging and supportive

Provide your hint:"""

    return prompt


def build_give_up_prompt(event: dict) -> str:
    """Build prompt for GIVE_UP event - provide complete solution with multiple approaches"""
    problem_title = event.get('problem_title', 'a coding problem')
    problem_description = event.get('problem_description', '')

    style_instructions = get_style_instructions(event)
    prompt = f"""You are an expert coding mentor acting according to the following profile:
{style_instructions}

A student has requested the complete solution to "{problem_title}".

**Problem:**
{problem_description}

**Instructions:**
Provide a comprehensive solution with THREE approaches:

1. **Brute Force Approach:**
   - Explain the most straightforward solution
   - Provide complete working code
   - Mention time/space complexity

2. **Good Approach:**
   - Explain a more optimized solution
   - Provide complete working code
   - Mention time/space complexity

3. **Best Approach:**
   - Explain the optimal solution
   - Provide complete working code
   - Mention time/space complexity
   - Explain why this is the best approach

**Format:**
Use clear headings and well-commented code. Be educational and thorough. This is a learning opportunity.

Provide the complete solution:"""

    return prompt