FROM python:3.11-slim

WORKDIR /app

# Copy shared modules
COPY shared/ /app/shared/

# Copy service files
COPY services/api-gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/api-gateway/ .

EXPOSE 8000

CMD ["python", "main.py"]