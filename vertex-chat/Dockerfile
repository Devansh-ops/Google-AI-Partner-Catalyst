FROM python:3.11-slim

WORKDIR /app

# Install uv for fast Python package installation
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY agent.py langgraph.json ./

# Expose LangGraph server port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/key.json

# Run LangGraph server
CMD ["langgraph", "dev", "--host", "0.0.0.0", "--port", "8000"]