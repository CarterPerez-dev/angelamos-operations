FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

RUN pip install uv && uv pip install --system --no-cache .

RUN python -c "import openwakeword; openwakeword.utils.download_models()"

COPY server/ ./server/
COPY models/ ./models/

EXPOSE 5003

CMD ["python", "-m", "uvicorn", "server.run:app", "--host", "0.0.0.0", "--port", "5003"]
