# 💬 Chat Service

The **Chat Service** enables deep, interactive conversations about the code. While the Hint Generator is for proactive nudges, the Chat Service is for when the user wants to stop and ask specific questions ("Why is my DP solution O(n^2)?").

## 🌟 Features

*   **Dedicated WebSocket**: Uses a separate WebSocket connection for high-frequency chat traffic, keeping the main logic pipeline clear.
*   **Context-Aware**: The chat session is initialized with the current state of the problem and code, so you don't have to copy-paste context.
*   **Multi-turn Memory**: Maintains the history of the conversation to handle follow-up questions naturally.

## 🛠 Stack

*   **Framework**: FastAPI

## 🚀 Running Locally

```bash
cd backend/services/chat-service
uvicorn main:app --port 8001 --reload
```
