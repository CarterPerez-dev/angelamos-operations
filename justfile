set shell := ["bash", "-uc"]
set dotenv-load

default:
    @just --list --unsorted

# =============================================================================
# SKAFFOLD - Development
# =============================================================================

dev:
    skaffold dev --port-forward --tail

dev-no-sync:
    skaffold dev --port-forward --tail --auto-sync=false

build:
    skaffold build

delete:
    skaffold delete

# =============================================================================
# KUBECTL - Manual Deploy
# =============================================================================

apply:
    kubectl apply -k overlays/dev

apply-prod:
    kubectl apply -k overlays/prod

destroy:
    kubectl delete -k overlays/dev

# =============================================================================
# SECRETS - Create from env files
# =============================================================================

create-secrets:
    @echo "Creating MongoDB secrets..."
    kubectl create secret generic mongodb-secrets \
      --from-env-file=../CertGamesDB-Argos/.env \
      --namespace=mongodb \
      --dry-run=client -o yaml | kubectl apply -f -
    @echo "Creating CarterOS secrets..."
    kubectl create secret generic carteros-secrets \
      --from-env-file=../.env \
      --namespace=carteros \
      --dry-run=client -o yaml | kubectl apply -f -
    @echo "Creating OneisuNun secrets..."
    kubectl create secret generic oneisnun-secrets \
      --from-env-file=../CertGamesDB-Argos/.env \
      --namespace=oneisnun \
      --dry-run=client -o yaml | kubectl apply -f -

create-mongodb-keyfile:
    kubectl create secret generic mongodb-keyfile \
      --from-file=keyfile=../CertGamesDB-Argos/scripts/keyfile \
      --namespace=mongodb \
      --dry-run=client -o yaml | kubectl apply -f -

# =============================================================================
# DATABASE - Migrations
# =============================================================================

migrate *ARGS:
    kubectl exec -it deployment/carteros-backend -n carteros -- alembic upgrade {{ARGS}}

migrate-head:
    kubectl exec -it deployment/carteros-backend -n carteros -- alembic upgrade head

migrate-down:
    kubectl exec -it deployment/carteros-backend -n carteros -- alembic downgrade -1

# =============================================================================
# MONGODB - Management
# =============================================================================

mongo-shell:
    kubectl exec -it mongodb-0 -n mongodb -- mongosh -u yoshi --authenticationDatabase admin

mongo-status:
    kubectl exec -it mongodb-0 -n mongodb -- mongosh -u yoshi --authenticationDatabase admin --eval "rs.status()"

init-replica:
    kubectl apply -f base/mongodb/init-job.yaml
    kubectl wait --for=condition=complete job/mongodb-init-replica -n mongodb --timeout=120s

backup-mongo:
    #!/usr/bin/env bash
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    kubectl exec mongodb-0 -n mongodb -- mongodump --archive --gzip \
      -u yoshi -p --authenticationDatabase admin > backup_${TIMESTAMP}.gz
    echo "Backup saved: backup_${TIMESTAMP}.gz"

restore-mongo file:
    kubectl exec -i mongodb-0 -n mongodb -- mongorestore --archive --gzip \
      -u yoshi -p --authenticationDatabase admin < {{file}}

# =============================================================================
# LOGS
# =============================================================================

logs-backend:
    kubectl logs -f -n carteros -l app=carteros-backend

logs-frontend:
    kubectl logs -f -n carteros -l app=carteros-frontend

logs-mongo:
    kubectl logs -f -n mongodb -l app=mongodb

logs-oneisnun:
    kubectl logs -f -n oneisnun -l app=oneisnun-backend

# =============================================================================
# STATUS
# =============================================================================

pods:
    kubectl get pods -A -o wide

services:
    kubectl get services -A

status:
    @echo "=== PODS ==="
    @kubectl get pods -A
    @echo ""
    @echo "=== SERVICES ==="
    @kubectl get services -A
    @echo ""
    @echo "=== PVCs ==="
    @kubectl get pvc -A

watch:
    watch -n 2 kubectl get pods -A

# =============================================================================
# DEBUG - Shell Access
# =============================================================================

shell-backend:
    kubectl exec -it -n carteros deployment/carteros-backend -- /bin/bash

shell-frontend:
    kubectl exec -it -n carteros deployment/carteros-frontend -- /bin/sh

shell-mongo:
    kubectl exec -it -n mongodb mongodb-0 -- /bin/bash

shell-oneisnun:
    kubectl exec -it -n oneisnun deployment/oneisnun-backend -- /bin/sh

events:
    kubectl get events -A --sort-by='.lastTimestamp'

describe pod namespace='carteros':
    kubectl describe pod {{pod}} -n {{namespace}}

# =============================================================================
# CLEANUP
# =============================================================================

cleanup-failed:
    kubectl delete pods --field-selector=status.phase=Failed -A

cleanup-evicted:
    kubectl delete pods --field-selector=status.phase=Evicted -A

nuke:
    @echo "WARNING: This will delete EVERYTHING in all namespaces!"
    @read -p "Are you sure? (y/N) " confirm && [ "$$confirm" = "y" ]
    kubectl delete namespace carteros mongodb oneisnun --ignore-not-found
