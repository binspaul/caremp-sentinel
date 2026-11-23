# ==========================================
# careMP Sentinel Care Coach Agent - Cloud Run Container
# ==========================================
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output for Cloud Logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0 \
    PYTHONPATH=/app

WORKDIR /app

# Create a non-privileged user for security
RUN useradd -m -u 1000 appuser

# Install dependencies first for efficient layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code into /app/agent to preserve the 'agent' package structure
COPY . /app/agent

# Change ownership to appuser
RUN chown -R appuser:appuser /app

USER appuser

# Default environment values (can be overridden by Cloud Run / docker-compose / env.yaml)
ENV BASE_URL=https:// \
    API_BASE_URL=https://v1 \
    ENGINES_API_URL=https://engines \
    USE_MOCK_API=false \
    ADK_MODEL=gemini-2.5-flash

# Expose default Cloud Run port
EXPOSE 8080

# Health check to ensure microservice is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request, os; port = os.environ.get('PORT', '8080'); res = urllib.request.urlopen(f'http://localhost:{port}/health'); exit(0 if res.status == 200 else 1)"

# Start the Care Coach Agent server on 0.0.0.0 listening on $PORT
CMD ["sh", "-c", "exec uvicorn agent.serve:app --host 0.0.0.0 --port ${PORT:-8080}"]
