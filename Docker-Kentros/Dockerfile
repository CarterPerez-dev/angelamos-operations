# =============================================================================
# AngelaMos | 2026
# Dockerfile
# =============================================================================

FROM golang:1.24-bookworm AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app ./cmd/server

# -----------------------------------------------------------------------------

FROM gcr.io/distroless/static-debian12

COPY --from=builder /app /app

USER nonroot:nonroot

EXPOSE 9001

ENTRYPOINT ["/app"]
