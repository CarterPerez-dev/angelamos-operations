# =============================================================================
# AngelaMos Operations | MEGA Justfile
# =============================================================================

set dotenv-load
set export
set shell := ["bash", "-uc"]

# =============================================================================
# Default
# =============================================================================

default:
    @just --list --unsorted

# =============================================================================
# CARTEROS - FastAPI Backend + React Frontend (Default Dev Commands)
# =============================================================================

[group('carteros')]
up *ARGS:
    docker compose up {{ARGS}}

[group('carteros')]
start *ARGS:
    docker compose up -d {{ARGS}}

[group('carteros')]
down *ARGS:
    docker compose down {{ARGS}}

[group('carteros')]
stop:
    docker compose stop

[group('carteros')]
build *ARGS:
    docker compose build {{ARGS}}

[group('carteros')]
rebuild:
    docker compose build --no-cache

[group('carteros')]
logs *SERVICE:
    docker compose logs -f {{SERVICE}}

[group('carteros')]
ps:
    docker compose ps

[group('carteros')]
shell service='backend':
    docker compose exec -it {{service}} /bin/bash

# CarterOS - Database Migrations
[group('carteros-db')]
migrate *ARGS:
    docker compose exec backend uv run alembic upgrade {{ARGS}}

[group('carteros-db')]
migration message:
    docker compose exec backend uv run alembic revision --autogenerate -m "{{message}}"

[group('carteros-db')]
rollback:
    docker compose exec backend uv run alembic downgrade -1

[group('carteros-db')]
db-history:
    docker compose exec backend alembic history --verbose

[group('carteros-db')]
db-current:
    docker compose exec backend alembic current

# CarterOS - Local Database (no Docker)
[group('carteros-db-local')]
migrate-local *ARGS:
    cd CarterOS-Server && uv run alembic upgrade {{ARGS}}

[group('carteros-db-local')]
migration-local message:
    cd CarterOS-Server && uv run alembic revision --autogenerate -m "{{message}}"

[group('carteros-db-local')]
rollback-local:
    cd CarterOS-Server && uv run alembic downgrade -1

# CarterOS - Linting
[group('carteros-lint')]
ruff *ARGS:
    ruff check CarterOS-Server/ {{ARGS}}

[group('carteros-lint')]
ruff-fix:
    ruff check CarterOS-Server/ --fix
    ruff format CarterOS-Server/

[group('carteros-lint')]
pylint *ARGS:
    pylint CarterOS-Server/src {{ARGS}}

[group('carteros-lint')]
lint: ruff pylint

# CarterOS - Frontend Linting
[group('carteros-frontend')]
biome *ARGS:
    cd CarterOS-Client && pnpm biome check . {{ARGS}}

[group('carteros-frontend')]
biome-fix:
    cd CarterOS-Client && pnpm biome check --write .

[group('carteros-frontend')]
stylelint *ARGS:
    cd CarterOS-Client && pnpm stylelint '**/*.scss' {{ARGS}}

[group('carteros-frontend')]
stylelint-fix:
    cd CarterOS-Client && pnpm stylelint '**/*.scss' --fix

[group('carteros-frontend')]
tsc *ARGS:
    cd CarterOS-Client && pnpm tsc --noEmit {{ARGS}}

# CarterOS - Type Checking
[group('carteros-types')]
mypy *ARGS:
    mypy CarterOS-Server/src {{ARGS}}

[group('carteros-types')]
typecheck: mypy

# CarterOS - Testing
[group('carteros-test')]
pytest *ARGS:
    pytest CarterOS-Server/tests {{ARGS}}

[group('carteros-test')]
test: pytest

[group('carteros-test')]
test-cov:
    pytest CarterOS-Server/tests --cov=CarterOS-Server/src --cov-report=term-missing --cov-report=html

# CarterOS - CI
[group('carteros-ci')]
ci: lint typecheck test

[group('carteros-ci')]
check: ruff mypy

# =============================================================================
# ONEISNUN - CertGamesDB-Argos (Go Backend + React Frontend + MongoDB)
# =============================================================================

# OneisuNun - MongoDB Replica Set
[group('oneisnun-db')]
oneisnun-mongo-up *ARGS:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml up {{ARGS}}

[group('oneisnun-db')]
oneisnun-mongo *ARGS:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml up -d {{ARGS}}

[group('oneisnun-db')]
oneisnun-mongo-down *ARGS:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml down {{ARGS}}

[group('oneisnun-db')]
oneisnun-mongo-stop:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml stop

[group('oneisnun-db')]
oneisnun-mongo-restart:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml restart

[group('oneisnun-db')]
oneisnun-mongo-status:
    cd CertGamesDB-Argos && ./scripts/mongo-status.sh

[group('oneisnun-db')]
oneisnun-mongo-logs:
    cd CertGamesDB-Argos && docker compose -f mongo-rs.yml logs -f

[group('oneisnun-db')]
oneisnun-mongo-logs-primary:
    docker logs -f mongodb_primary --tail 100

# OneisuNun - Application (Backend + Frontend)
[group('oneisnun')]
oneisnun-up *ARGS:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml up {{ARGS}}

[group('oneisnun')]
oneisnun *ARGS:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml up -d {{ARGS}}

[group('oneisnun')]
oneisnun-down *ARGS:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml down {{ARGS}}

[group('oneisnun')]
oneisnun-stop:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml stop

[group('oneisnun')]
oneisnun-restart:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml restart

[group('oneisnun')]
oneisnun-build *ARGS:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml up -d --build {{ARGS}}

[group('oneisnun')]
oneisnun-logs:
    cd CertGamesDB-Argos && docker compose -f dev.compose.yml logs -f

[group('oneisnun')]
oneisnun-logs-backend:
    docker logs -f oneisnun_backend --tail 100

[group('oneisnun')]
oneisnun-logs-frontend:
    docker logs -f oneisnun_frontend --tail 100

# OneisuNun - Go Backend Development
[group('oneisnun-go')]
oneisnun-dev:
    cd CertGamesDB-Argos/go-backend && air -c .air.toml

[group('oneisnun-go')]
oneisnun-run:
    cd CertGamesDB-Argos/go-backend && go run ./cmd/api

[group('oneisnun-go')]
oneisnun-go-build:
    cd CertGamesDB-Argos/go-backend && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/api ./cmd/api

[group('oneisnun-go')]
oneisnun-test:
    cd CertGamesDB-Argos/go-backend && go test -v -race -coverprofile=coverage.out ./...

[group('oneisnun-go')]
oneisnun-lint:
    cd CertGamesDB-Argos/go-backend && golangci-lint run --timeout=5m

[group('oneisnun-go')]
oneisnun-fmt:
    cd CertGamesDB-Argos/go-backend && gofumpt -w . && goimports -w .

[group('oneisnun-go')]
oneisnun-tidy:
    cd CertGamesDB-Argos/go-backend && go mod tidy

# OneisuNun - Go Migrations
[group('oneisnun-migrate')]
oneisnun-migrate-up:
    cd CertGamesDB-Argos/go-backend && goose -dir migrations postgres "${DATABASE_URL}" up

[group('oneisnun-migrate')]
oneisnun-migrate-down:
    cd CertGamesDB-Argos/go-backend && goose -dir migrations postgres "${DATABASE_URL}" down

[group('oneisnun-migrate')]
oneisnun-migrate-status:
    cd CertGamesDB-Argos/go-backend && goose -dir migrations postgres "${DATABASE_URL}" status

[group('oneisnun-migrate')]
oneisnun-migrate-create name:
    cd CertGamesDB-Argos/go-backend && goose -dir migrations create {{name}} sql

# OneisuNun - Keys
[group('oneisnun-keys')]
oneisnun-generate-keys:
    #!/usr/bin/env bash
    set -euo pipefail
    cd CertGamesDB-Argos/go-backend
    mkdir -p keys
    openssl ecparam -genkey -name prime256v1 -noout -out keys/private.pem
    openssl ec -in keys/private.pem -pubout -out keys/public.pem
    chmod 600 keys/private.pem
    echo "ES256 keypair generated in CertGamesDB-Argos/go-backend/keys/"

# =============================================================================
# TELEGRAM - CarterBot Telegram
# =============================================================================

[group('telegram')]
telegram-start:
    cd CarterBot-Telegram && bun run start

[group('telegram')]
telegram-dev:
    cd CarterBot-Telegram && bun run dev

[group('telegram')]
telegram-typecheck:
    cd CarterBot-Telegram && bun run typecheck

[group('telegram')]
telegram-install:
    cd CarterBot-Telegram && bun install

# Telegram - Systemd Service
[group('telegram-service')]
telegram-status:
    systemctl --user status carterbot

[group('telegram-service')]
telegram-restart:
    systemctl --user restart carterbot

[group('telegram-service')]
telegram-stop:
    systemctl --user stop carterbot

[group('telegram-service')]
telegram-logs:
    journalctl --user -u carterbot -f

# =============================================================================
# KENTROS - Docker-Kentros (Holophyly Go Scanner)
# =============================================================================

[group('kentros')]
kentros-run *ARGS:
    cd Docker-Kentros && go run ./cmd/server {{ARGS}}

[group('kentros')]
kentros-build:
    cd Docker-Kentros && go build -o bin/Docker-Kentros ./cmd/server

[group('kentros')]
kentros-build-prod:
    cd Docker-Kentros && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o bin/Docker-Kentros ./cmd/server

# Kentros - Docker
[group('kentros-docker')]
kentros-docker-build:
    cd Docker-Kentros && docker build -t Docker-Kentros:latest .

[group('kentros-docker')]
kentros-docker-run:
    cd Docker-Kentros && docker run --rm -p 9001:9001 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v $HOME/dev:/root/dev:ro \
        -v $HOME/projects:/root/projects:ro \
        --user root \
        -e HOLOPHYLY_SERVER_HOST=0.0.0.0 \
        -e HOLOPHYLY_SCANNER_PATHS=/root/dev,/root/projects \
        Docker-Kentros:latest

[group('kentros-docker')]
kentros-up:
    cd Docker-Kentros && docker compose up --build

[group('kentros-docker')]
kentros-up-d:
    cd Docker-Kentros && docker compose up --build -d

[group('kentros-docker')]
kentros-down:
    cd Docker-Kentros && docker compose down

[group('kentros-docker')]
kentros-logs:
    cd Docker-Kentros && docker compose logs -f holophyly

# Kentros - Linting
[group('kentros-lint')]
kentros-lint *ARGS:
    cd Docker-Kentros && golangci-lint run {{ARGS}}

[group('kentros-lint')]
kentros-lint-fix:
    cd Docker-Kentros && golangci-lint run --fix

[group('kentros-lint')]
kentros-fmt:
    cd Docker-Kentros && gofmt -w -s . && goimports -w .

# Kentros - Testing
[group('kentros-test')]
kentros-test *ARGS:
    cd Docker-Kentros && go test ./... {{ARGS}}

[group('kentros-test')]
kentros-test-race:
    cd Docker-Kentros && go test -race ./...

[group('kentros-test')]
kentros-test-cov:
    cd Docker-Kentros && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html

# Kentros - CI
[group('kentros-ci')]
kentros-ci: kentros-lint kentros-test-race
    @echo "All Kentros checks passed"

[group('kentros-ci')]
kentros-tidy:
    cd Docker-Kentros && go mod tidy && go mod verify

# =============================================================================
# K8S - Kubernetes (for fun/learning)
# =============================================================================

[group('k8s')]
k8s-dev:
    cd k8s && skaffold dev --port-forward --tail

[group('k8s')]
k8s-build:
    cd k8s && skaffold build

[group('k8s')]
k8s-delete:
    cd k8s && skaffold delete

[group('k8s')]
k8s-apply:
    cd k8s && kubectl apply -k overlays/dev

[group('k8s')]
k8s-destroy:
    cd k8s && kubectl delete -k overlays/dev

[group('k8s')]
k8s-pods:
    kubectl get pods -A -o wide

[group('k8s')]
k8s-services:
    kubectl get services -A

[group('k8s')]
k8s-status:
    @echo "=== PODS ===" && kubectl get pods -A
    @echo "" && echo "=== SERVICES ===" && kubectl get services -A

# =============================================================================
# UTILITIES
# =============================================================================

[group('util')]
info:
    @echo "AngelaMos Operations"
    @echo "Projects: CarterOS, OneisuNun, CarterBot-Telegram, Docker-Kentros"
    @echo "OS: {{os()}} ({{arch()}})"

[group('util')]
clean:
    @echo "Cleaning CarterOS caches..."
    -rm -rf CarterOS-Server/.mypy_cache
    -rm -rf CarterOS-Server/.pytest_cache
    -rm -rf CarterOS-Server/.ruff_cache
    -rm -rf CarterOS-Server/htmlcov
    -rm -rf CarterOS-Server/.coverage
    @echo "Cleaning OneisuNun caches..."
    -rm -rf CertGamesDB-Argos/go-backend/bin
    -rm -rf CertGamesDB-Argos/go-backend/coverage.out
    -rm -rf CertGamesDB-Argos/go-backend/coverage.html
    -rm -rf CertGamesDB-Argos/go-backend/tmp
    @echo "Cleaning Kentros caches..."
    -rm -rf Docker-Kentros/bin
    -rm -rf Docker-Kentros/coverage.out
    -rm -rf Docker-Kentros/coverage.html
    @echo "Done!"

[group('util')]
status-all:
    @echo "=== Docker Containers ===" && docker ps --format "table {{{{.Names}}}}\t{{{{.Status}}}}\t{{{{.Ports}}}}"
    @echo ""
    @echo "=== CarterBot Service ===" && systemctl --user is-active carterbot || true
