# 🧠 Pattern Processor Service

The **Pattern Processor** is the analytical engine of LeetCode Mentor. It drastically reduces noise and identifies meaningful user actions by analyzing the stream of raw events.

## ⚡️ Key Features

*   **Smart Diffing**: It doesn't just look at the last keypress. It maintains a sliding window of the user's code history and calculates specific diffs relative to previous "stable" versions.
*   **Struggle Detection**:
    *   **Rapid Deletion**: Detects if a user deleted a large chunk of code (signaling a restart).
    *   **Looping Errors**: Detects if the user is hitting the same error message repeatedly.
*   **State Management**: Maintains a lightweight in-memory session state for active users to provide context (e.g., "User has tried 5 times in the last minute").
*   **Routing**: Decides whether an event needs AI intervention. If so, it enriches the event with context and forwards it to the `hint-generator`.

## 🛠 Stack

*   **Language**: Python
*   **Streaming**: Kafka Consumer (Raw Events) -> Logic -> Kafka Producer (Intervention Requests)

## 🚀 Running Locally

```bash
cd backend/services/pattern-processor
python main.py
```
