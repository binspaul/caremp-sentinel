# Lightweight Python 3.11 base image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user for security
RUN useradd -m -u 1000 appuser

# Install dependencies first for efficient layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY src/ ./src/

# Change ownership to appuser
RUN chown -R appuser:appuser /app

USER appuser

# Expose ports: 5001 for local dev, 8080 for Cloud Run
EXPOSE 5001 8080

# Health check to ensure microservice is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import httpx, os; port = os.getenv('PORT', '5001'); res = httpx.get(f'http://localhost:{port}/health'); exit(0 if res.status_code == 200 else 1)"

# Run FastAPI app with Uvicorn, dynamically binding to $PORT provided by Cloud Run (defaulting to 5001)
CMD ["sh", "-c", "exec uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-5001}"]
