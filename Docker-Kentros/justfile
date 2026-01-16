# =============================================================================
# AngelaMos | 2025
# justfile
# =============================================================================

set dotenv-load
set export
set shell := ["bash", "-uc"]
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

project := file_name(justfile_directory())
version := `git describe --tags --always 2>/dev/null || echo "dev"`

# =============================================================================
# Default
# =============================================================================

default:
    @just --list --unsorted

# =============================================================================
# Development
# =============================================================================

[group('dev')]
run *ARGS:
    go run ./cmd/server {{ARGS}}

[group('dev')]
build:
    go build -o bin/{{project}} ./cmd/server

[group('dev')]
build-prod:
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o bin/{{project}} ./cmd/server

# =============================================================================
# Docker
# =============================================================================

[group('docker')]
docker-build:
    docker build -t {{project}}:{{version}} -t {{project}}:latest .

[group('docker')]
docker-run:
    docker run --rm -p 9001:9001 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v $HOME/dev:/root/dev:ro \
        -v $HOME/projects:/root/projects:ro \
        --user root \
        -e HOLOPHYLY_SERVER_HOST=0.0.0.0 \
        -e HOLOPHYLY_SCANNER_PATHS=/root/dev,/root/projects \
        {{project}}:latest

[group('docker')]
docker-up:
    docker build -t {{project}}:{{version}} -t {{project}}:latest .
    docker run --rm -p 9001:9001 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v $HOME/dev:/root/dev:ro \
        -v $HOME/projects:/root/projects:ro \
        --user root \
        -e HOLOPHYLY_SERVER_HOST=0.0.0.0 \
        -e HOLOPHYLY_SCANNER_PATHS=/root/dev,/root/projects \
        {{project}}:latest

[group('docker')]
docker-stop:
    -docker stop $(docker ps -q --filter ancestor={{project}}:latest)

[group('docker')]
up:
    docker compose up --build

[group('docker')]
up-d:
    docker compose up --build -d

[group('docker')]
down:
    docker compose down

[group('docker')]
logs:
    docker compose logs -f holophyly

# =============================================================================
# Linting and Formatting
# =============================================================================

[group('lint')]
lint *ARGS:
    golangci-lint run {{ARGS}}

[group('lint')]
lint-fix:
    golangci-lint run --fix

[group('lint')]
fmt:
    gofmt -w -s .
    goimports -w .

[group('lint')]
check: lint
    go vet ./...

# =============================================================================
# Testing
# =============================================================================

[group('test')]
test *ARGS:
    go test ./... {{ARGS}}

[group('test')]
test-race:
    go test -race ./...

[group('test')]
test-cov:
    go test -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out -o coverage.html

# =============================================================================
# CI / Quality
# =============================================================================

[group('ci')]
ci: lint test-race
    @echo "All checks passed"

[group('ci')]
tidy:
    go mod tidy
    go mod verify

# =============================================================================
# Utilities
# =============================================================================

[group('util')]
info:
    @echo "Project: {{project}}"
    @echo "Version: {{version}}"
    @echo "OS: {{os()}} ({{arch()}})"

[group('util')]
clean:
    -rm -rf bin/
    -rm -rf coverage.out coverage.html
    @echo "Cleaned"
