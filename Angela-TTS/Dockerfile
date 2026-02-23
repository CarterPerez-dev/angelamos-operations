FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .

RUN pip install uv && uv pip install --system --no-cache .

COPY server/ ./server/

EXPOSE 5002

CMD ["python", "-m", "uvicorn", "server.run:app", "--host", "0.0.0.0", "--port", "5002"]
