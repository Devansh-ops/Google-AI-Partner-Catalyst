import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load API Key
load_dotenv()

class ChatBot:
    def __init__(self):
        """
        Initialize the Gemini ChatBot.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
            
        genai.configure(api_key=api_key)


        self.system_prompt = (
            "You are a Senior Software Engineer acting as a collaborative coding partner. "
            "A separate service provides hints; your job is to engage in a deep back-and-forth "
            "discussion about the problem and the user's code. \n\n"
            "1. Help the user brainstorm logic.\n"
            "2. If they ask about a bug, explain why it's happening.\n"
            "3. Analyze Time and Space complexity when asked.\n"
            "4. Maintain a helpful, technical, and encouraging tone."
            "5. If you are provided with hints, incorporate them into your guidance without revealing them directly unless necessary."
        )


        self.model = genai.GenerativeModel(
            model_name='gemini-3-flash-preview',
            system_instruction=self.system_prompt
        )
        
        self.chat_session = None

    def start_session(self, problem_stmt: str = None, current_code: str = None, hints: list = None):
        """
        Starts a new chat session with context.
        """
        history = []
        
        # Construct initial context message if provided
        if problem_stmt or current_code or hints:
            context_parts = ["CONTEXT:"]
            if problem_stmt:
                context_parts.append(f"Problem: {problem_stmt}")
            if current_code:
                context_parts.append(f"Code: {current_code}")
            if hints:
                context_parts.append(f"Hints available: {hints}")

            self.initial_context = "\n".join(context_parts)
        else:
            self.initial_context = ""

        self.chat_session = self.model.start_chat(history=history)

    def send_message(self, user_message: str):
        """
        Sends a message to the chat session and returns the response.
        """
        if not self.chat_session:
            raise RuntimeError("Chat session not started. Call start_session() first.")

        full_message = user_message
        
        if not self.chat_session.history and self.initial_context:
            full_message = f"{self.initial_context}\n\nUSER QUESTION: {user_message}"
            self.initial_context = None # Clear it so we don't send it again

        try:
            response = self.chat_session.send_message(
                full_message,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000
                )
            )
            return response.text
        except Exception as e:
            return f"System Error: {str(e)}"