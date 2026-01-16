# 2 is something

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
# MongoDB Replica Set
# =============================================================================

[group("db")]
mongo-up *ARGS:
    docker compose -f mongo-rs.yml up {{ARGS}}

[group("db")]
mongo *ARGS:
    docker compose -f mongo-rs.yml up -d {{ARGS}}

[group("db")]
mongo-down *ARGS:
    docker compose -f mongo-rs.yml down {{ARGS}}

[group("db")]
mongo-stop:
    docker compose -f mongo-rs.yml stop

[group("db")]
mongo-restart:
    docker compose -f mongo-rs.yml restart

[group("db")]
mongo-status:
    @./scripts/mongo-status.sh

[group("db")]
mongo-logs:
    docker compose -f mongo-rs.yml logs -f

[group("db")]
mongo-logs-primary:
    docker logs -f mongodb_primary --tail 100

# =============================================================================
# Application (Backend + Frontend)
# =============================================================================

[group("app")]
app-up *ARGS:
    docker compose -f dev.compose.yml up {{ARGS}}

[group("app")]
app *ARGS:
    docker compose -f dev.compose.yml up -d {{ARGS}}

[group("app")]
app-down *ARGS:
    docker compose -f dev.compose.yml down {{ARGS}}

[group("app")]
app-stop:
    docker compose -f dev.compose.yml stop

[group("app")]
app-restart:
    docker compose -f dev.compose.yml restart

[group("app")]
app-build *ARGS:
    docker compose -f dev.compose.yml up -d --build {{ARGS}}

[group("app")]
app-logs:
    docker compose -f dev.compose.yml logs -f

[group("app")]
app-logs-backend:
    docker logs -f oneisnun_backend --tail 100

[group("app")]
app-logs-frontend:
    docker logs -f oneisnun_frontend --tail 100

