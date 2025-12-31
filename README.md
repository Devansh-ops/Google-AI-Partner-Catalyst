# 🚀 LeetCode Mentor

> **Your AI-Powered Pair Programmer for LeetCode**  
> *Real-time hints, personalized guidance, and mental support—without giving away the answer.*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 💡 Inspiration

We've all been there: staring at a LeetCode problem for 45 minutes, completely stuck, until we finally crack and check the solution or paste the problem into ChatGPT. The result? instant relief, but **zero learning**. You get the "what" but miss the "how."

We wanted to fix this broken loop. We asked ourselves: *What if you had a Senior Staff Engineer sitting next to you?* They wouldn't just grab your keyboard and type the answer. They would look at your code, point out a flaw in your logic, or ask a guiding question to help you unblock yourself. That is the experience we built **LeetCode Mentor** to replicate—bringing the power of pair programming to solitary practice.

## 🚀 What it does

**LeetCode Mentor** is an intelligent browser extension that transforms LeetCode into an interactive learning environment.

*   **Deep Chat Integration:** Stuck on a specific concept? Open the chat mode to have a deep, multi-turn conversation about *your* specific code implementation without ever leaving the page. (See **[Chat Service](./vertex-chat)** for implementation details.)
*   **Real-time AI Observation:** It watches your keystrokes and code changes live as you type.
*   **Socratic Guidance:** Instead of giving answers, it provides **subtle, context-aware nudges**. If you have an off-by-one error, it hints at checking your loop bounds. If you miss a base case, it gently reminds you.
*   **Struggle Detection:** It analyzes behavioral patterns—like rapid tab switching or repeated failed test runs—to detect when you are frustrated and proactively offers help.
*   **Adaptive Personas:** Choose your mentor's personality! From a "Supportive Guide" who cheers you on to a "Rude Senior Engineer" who ruthlessly (but helpfully) critiques your inefficiency.

## ⚙️ How we built it

We engineered a sophisticated **Event-Driven Microservices Architecture** to ensure low latency and high scalability.

*   **Frontend**: Built with **React** and **Vite**, injected directly into the LeetCode page via a Chrome Extension using **Shadow DOM** for complete style isolation. It captures user events (typing, test runs, tab switches) and streams them via WebSockets.
*   **Event Streaming**: We use **Confluent Kafka** as our central nervous system. Every user interaction is an event that flows through our pipeline, decoupling event ingestion from heavy AI processing.
*   **Pattern Recognition**: A specialized **Python** service consumes the Kafka stream, maintaining a sliding window of user activity. It calculates "diffs" on the fly to distinguish between minor typos and significant logic changes.
*   **AI Engine**: We leverage **Google Vertex AI (Gemini Models)** for the intelligence layer. Our **Hint Generator** service constructs dynamic prompts including the user's code history, error logs, and current approach to generate pedagogically sound advice.
*   **Backend**: Powered by **FastAPI**, handling the WebSocket connections and orchestrating the flow between the user and the Kafka ecosystem.

## 🚧 Challenges we ran into

*   **The "Helper" Paradox**: The hardest part wasn't technical, it was prompting. Getting an LLM *not* to solve the problem is surprisingly difficult. We spent hours refining system prompts to force Gemini to be Socratic—to ask questions rather than provide code snippets.
*   **DOM Injection Nightmares**: LeetCode uses the Monaco Editor (same as VS Code), which is complex. Intercepting keystrokes without breaking their editor or causing lag required deep reverse-engineering of their internal events.
*   **Real-time Latency**: Chaining a WebSocket → Kafka Producer → Consumer → Vertex AI → Producer → WebSocket created a long round-trip. We had to optimize our Kafka consumer groups and batching settings to ensure the "typing to hint" latency felt instantaneous.
*   **State Management**: Tracking "sessions" across a stateless architecture was tricky. We had to implement a distributed state store concept within our Python services to remember *what* the user tried 5 minutes ago so the AI wouldn't repeat itself.

## 🏆 Accomplishments that we're proud of

*   **Seamless Integration**: The UI looks native. It feels like a premium feature LeetCode built themselves, not a hacky add-on.
*   **The "Rude" Persona**: It sounds silly, but tuning the AI to be "sarcastic but helpful" was a blast and actually makes the learning process more engaging and less monotonous.
*   **Architecture Quality**: We didn't just write a script; we built a production-grade system. Using Kafka and Microservices for a hackathon project was overkill, but it proves the system can scale to thousands of concurrent users.
*   **Smart Diffing**: Implementing a custom diffing algorithm that ignores whitespace changes but alerts on logic shifts was a huge win for reducing API costs and noise.

## 🧠 What we learned

*   **Prompt Engineering is Engineering**: It requires version control, testing, and iteration just like code. Small changes in the system prompt yielded massive differences in the utility of the hints.
*   **Event-Driven Complexity**: While powerful, debugging distributed events is hard. You can't just set a breakpoint. We learned the importance of comprehensive logging and correlation IDs to trace a request through the system.
*   **User Psychology**: Users don't always want help when they struggle. Timing is everything. We learned to rely on explicit "Hint Requests" more than auto-interventions to avoid being annoying (like "Clippy").

## 🔮 What's next for LeetCode Mentor Extension

*   **Voice Mode**: Real-time voice conversation with your AI mentor for a true pair-programming feel.
*   **NeetCode Roadmap Integration**: Automatically tracking progress against popular study plans (like NeetCode 150) and offering tailored advice based on previous problems solved.
*   **Multi-Language Support**: Expanding beyond Python/Java/C++ to support every language LeetCode supports, with language-specific idioms and best practices.
*   **Mock Interview Mode**: A specialized mode where the AI acts as an interviewer, asking you to explain your thought process out loud before writing a single line of code.

## 🛠 Project Structure

```
├── frontend/               # React + Vite Chrome Extension
├── backend/
│   ├── services/
│   │   ├── api-gateway/    # FastAPI WebSocket Gateway
│   │   ├── pattern-processor/ # Kafka Consumer & Logic Engine
│   │   └── hint-generator/ # Vertex AI Integration
│   └── shared/             # Shared Utils & Models
├── vertex-chat/            # LangGraph Component (Interactive Chat)
```
