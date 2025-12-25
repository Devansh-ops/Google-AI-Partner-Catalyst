import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load API Key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# persona: Collaborative Coding Partner
SYSTEM_PROMPT = (
    "You are a Senior Software Engineer acting as a collaborative coding partner. "
    "A separate service provides hints; your job is to engage in a deep back-and-forth "
    "discussion about the problem and the user's code. \n\n"
    "1. Help the user brainstorm logic.\n"
    "2. If they ask about a bug, explain why it's happening.\n"
    "3. Analyze Time and Space complexity when asked.\n"
    "4. Maintain a helpful, technical, and encouraging tone."
)

# Initialize the Gemini 3 Flash Preview model
model = genai.GenerativeModel(
    model_name='gemini-3-flash-preview',
    system_instruction=SYSTEM_PROMPT
)

# Persistent chat session to keep track of history
chat_session = model.start_chat(history=[])

def chat_with_mentor(user_message, problem_stmt=None, current_code=None):
    """
    Handles a turn in the conversation.
    If it's the first turn, we include the problem and code context.
    """
    # Context Injection for the first message or if updated
    full_message = user_message
    if problem_stmt or current_code:
        full_message = f"CONTEXT:\nProblem: {problem_stmt}\nCode: {current_code}\n\nUSER QUESTION: {user_message}"

    try:
        response = chat_session.send_message(
            full_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000  # Allow longer responses for deep discussion
            )
        )
        return response.text
    except Exception as e:
        return f"System Error: {str(e)}"


if __name__ == "__main__":
    print("\033[1;36m--- LeetCode Problem Partner (Gemini 3) ---\033[0m")
    
    prob = input("Paste Problem Statement: ")
    code = input("Paste Current Code: ")
    
    print("\n\033[1;32mPartner joined the chat! Ask anything about the problem or code.\033[0m")
    
    first_query = "Can you help me understand the logic required for this?"
    print(f"\nUser: {first_query}")
    print(f"Partner: {chat_with_mentor(first_query, prob, code)}")

    while True:
        user_input = input("\n\033[1;34mYou: \033[0m")
        if user_input.lower() in ['exit', 'quit']: break
        
        reply = chat_with_mentor(user_input)
        print(f"\n\033[1;33mPartner:\033[0m {reply}")