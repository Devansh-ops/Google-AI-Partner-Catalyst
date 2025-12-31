FROM python:3.11-slim

WORKDIR /app

# Copy shared modules
COPY shared/ /app/shared/

# Copy service files
COPY services/hint-generator/normal-pool/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/hint-generator/normal-pool/ .

# Service account key will be mounted as volume
# or set via environment variable

CMD ["python", "start.py"]

LABEL org.opencontainers.image.source https://github.com/Devansh-ops/Google-AI-Partner-Catalyst
