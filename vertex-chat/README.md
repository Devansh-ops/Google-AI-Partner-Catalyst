# 💬 Vertex Chat Service

The **Vertex Chat Service** acts as the dedicated conversational agent for LeetCode Mentor. Unlike the hint generator which provides one-off nudges, this service maintains a stateful, multi-turn dialogue with the user to explore concepts in depth.

## 🤖 Technology Stack

*   **Engine**: [LangGraph](https://langchain-ai.github.io/langgraph/) - Enables stateful, cyclic setups for agentic workflows.
*   **Model**: Google Vertex AI (Gemini Models).
*   **Deployment**: Runs as a separate service enabling independent scaling of conversational compute resources.

## 🌟 Capabilities

*   **Context Retention**: Remembers previous questions and answers during the session.
*   **Tool Use**: (Future) Can access external tools or run code snippets to verify explanations.
*   **Agentic Workflow**: Uses a ReAct (Reasoning + Acting) pattern to determine the best way to help the user—whether to explain a concept, visualize a data structure, or ask a clarifying question.

## 🚀 Running Locally

This service is a LangGraph application.

```bash
# Navigate to directory
cd vertex-chat

# Install dependencies
pip install -U langgraph langchain-google-vertexai

# Run the graph (if using langgraph-cli)
langgraph dev
```
