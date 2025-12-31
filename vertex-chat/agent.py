import os
from typing import Annotated, TypedDict
from langchain_google_vertexai import ChatVertexAI
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool

# 1. Setup Vertex AI (Ensure gcloud auth is configured)
llm = ChatVertexAI(model="gemini-2.5-flash")

# 2. Define Tools
@tool
def get_weather(city: str):
    """Get the current weather."""
    return f"The weather in {city} is sunny and 75°F."

tools = [get_weather]

# 3. Create the Graph
# This is the object the server will serve
graph = create_react_agent(llm, tools)