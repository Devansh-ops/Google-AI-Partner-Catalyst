import logging
import google.generativeai as genai
from config import config

logger = logging.getLogger(__name__)

class ChatAgent:
    def __init__(self):
        if not config.GOOGLE_API_KEY:
            logger.error("GOOGLE_API_KEY is not set!")
            raise ValueError("GOOGLE_API_KEY is required")
            
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')
        logger.info("ChatAgent initialized with Gemini Pro")

    def _build_system_prompt(self, context: dict) -> str:
        """Constructs the system prompt with context"""
        problem_context = context.get('problem_context', {})
        current_code = context.get('current_code', 'No code provided yet.')
        previous_hints = context.get('previous_hints', [])
        
        prompt = f"""You are an expert Coding Mentor and Interview Helper. 
Your goal is to guide the user to solve the problem by themselves.
Do NOT give the full solution immediately unless explicitly asked or if they are completely stuck after multiple hints.

Context:
- Problem: {problem_context.get('title', 'Unknown Problem')}
- Description: {problem_context.get('description', 'No description')}
- Difficulty: {problem_context.get('difficulty', 'Unknown')}
- URL: {problem_context.get('url', 'N/A')}

User's Current Code:
```
{current_code}
```

Previous Hints Given:
{chr(10).join(f"- {h}" for h in previous_hints)}

Instructions:
1. Analyze the user's code and the problem.
2. If there are syntax errors, point them out gently.
3. If the logic is flawed, ask leading questions to help them uncover the bug.
4. Be encouraging and supportive.
5. Keep responses concise and conversational.
"""
        return prompt

    def generate_response(self, message: str, context: dict) -> str:
        """Generates a response to the user's message"""
        try:
            logger.info(f"Generating response for message: {message}")
            system_prompt = self._build_system_prompt(context)
          
            
            chat = self.model.start_chat(history=[])
            
            full_prompt = f"{system_prompt}\n\nUser Message: {message}"
            
            response = chat.send_message(full_prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I'm having a bit of trouble thinking right now. Could you try asking that again?"
