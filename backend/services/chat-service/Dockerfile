FROM python:3.10-slim

WORKDIR /app

# Copy shared modules first (context needs to be root of repo)
COPY backend/shared /app/backend/shared

# Copy service code
COPY backend/services/chat-service/app /app/backend/services/chat-service/app

# Install dependencies
WORKDIR /app/backend/services/chat-service/app
RUN pip install --no-cache-dir -r requirements.txt

# Run service
CMD ["python", "main.py"]
