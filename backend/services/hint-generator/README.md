# 💡 Hint Generator Service

The **Hint Generator** is the "Voice" of the mentor. It turns abstract requests for help into concrete, Socratic guidance using Google's generative AI models.

## 🤖 How It Works

1.  **Context Construction**: Receives an enriched `HintObject` from the Pattern Processor. This contains:
    *   The current code.
    *   The diff from the previous version.
    *   Recent error messages.
    *   User Persona (e.g., "Rude Senior Dev").
2.  **Prompt Engineering**: Dynamically builds a system prompt for Gemini. We use techniques like Chain-of-Thought to ensure the model *analyzes* before *speaking*.
3.  **Socratic Guardrails**: The prompts are strictly tuned to prevent the model from outputting the solution code. Instead, it is instructed to ask leading questions.
4.  **Vertex AI Integration**: Hits the Google Vertex AI API to generate the response.
5.  **Output**: Produces the final natural language hint to the `hint-response` Kafka topic.

## 🛠 Stack

*   **AI Provider**: Google Vertex AI (Gemini Pro)
*   **Streaming**: Kafka Consumer/Producer

## 🚀 Running Locally

```bash
cd backend/services/hint-generator/normal-pool
python main.py
```
