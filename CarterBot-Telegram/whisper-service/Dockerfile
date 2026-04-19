# ©AngelaMos | 2026
# Dockerfile

FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV LD_LIBRARY_PATH=/usr/local/lib/python3.13/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.13/site-packages/nvidia/cudnn/lib:${LD_LIBRARY_PATH}

COPY server.py .

EXPOSE 5069

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5069"]
