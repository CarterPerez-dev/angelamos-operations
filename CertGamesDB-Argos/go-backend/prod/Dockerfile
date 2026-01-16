# AngelaMos | 2026
# Dockerfile - Multi-stage production build

FROM golang:1.23-bookworm AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app ./cmd/api

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    mongodb-database-tools \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app /app/server
COPY --from=builder /build/config.yaml /app/config.yaml

RUN mkdir -p /app/data /app/backups && \
    useradd -r -s /bin/false appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/server"]
