FROM python:3.11-slim

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies directly from pyproject.toml
RUN pip install --no-cache-dir \
    "langchain-google-genai>=4.1.2" \
    "langchain-google-vertexai>=3.2.0" \
    "langgraph-cli[draw,inmem]>=0.4.11"

# Copy application code
COPY agent.py langgraph.json ./

# Create empty .env file (langgraph.json references it)
RUN touch .env

# Expose LangGraph server port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/key.json

# Run LangGraph server in dev mode without file watching
CMD ["langgraph", "dev", "--no-reload", "--host", "0.0.0.0", "--port", "8000", "--cors-allow-origins", "*", "--cors-allow-methods", "*", "--cors-allow-headers", "*"]