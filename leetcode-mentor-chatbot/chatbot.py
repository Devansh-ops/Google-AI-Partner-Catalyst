import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


SYSTEM_PROMPT = (
    "You are a LeetCode Mentor. Your output must be a 'HINT' or 'CRITIQUE'. "
    "Keep responses under 3 sentences. Focus on the algorithmic pattern or "
    "a specific logic bug. Never reveal the full code solution."
)

model = genai.GenerativeModel(
    model_name='gemini-3-flash-preview',
    system_instruction=SYSTEM_PROMPT
)


chat_session = model.start_chat(history=[])

def get_leetcode_hint(problem_statement, current_code):
    user_message = f"PROBLEM:\n{problem_statement}\n\nMY CODE:\n{current_code}"
    
    try:
        response = chat_session.send_message(
            user_message,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7
            )
        )
        return response.text.strip()
    except Exception as e:
        return f"Error connecting to Mentor: {str(e)}"

if __name__ == "__main__":
    print("\033[1;36m--- LeetCode Mentor (Gemini 3 Flash) ---\033[0m")
    
    p_statement = "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
    c_attempt = "def twoSum(nums, target): \n    for i in range(len(nums)): \n        pass # I am stuck here"
    
    hint = get_leetcode_hint(p_statement, c_attempt)
    print(f"\n\033[1;33mHint:\033[0m {hint}")