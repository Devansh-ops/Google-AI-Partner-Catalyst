FROM python:3.11-slim

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN pip install --no-cache-dir -e .

# Copy application code
COPY agent.py langgraph.json ./

# Expose LangGraph server port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/key.json

# Run LangGraph server in production mode
CMD ["python", "-m", "langgraph", "up", "--host", "0.0.0.0", "--port", "8000"]