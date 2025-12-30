# Dockerfile for Pattern Processor (Simplified 5-Event Architecture)

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY services/pattern-processor/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared models and utilities
COPY shared /app/shared

# Copy pattern processor files
COPY services/pattern-processor/config.py ./config.py
COPY services/pattern-processor/main.py ./main.py

# Create state directory
RUN mkdir -p /app/state

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/vertex-ai-key.json
ENV PROCESSOR_STATE_DIR=/app/state

# Run the processor
CMD ["python", "main.py"]