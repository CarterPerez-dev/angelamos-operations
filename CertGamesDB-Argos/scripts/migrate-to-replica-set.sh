#!/bin/bash
# AngelaMos | 2026
# Migrate from standalone MongoDB to Replica Set

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   MongoDB Standalone → Replica Set Migration  ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

if [ ! -f "$SCRIPT_DIR/keyfile" ]; then
    echo -e "${RED}ERROR: Keyfile not found!${NC}"
    echo "Run: ./scripts/generate-keyfile.sh"
    exit 1
fi

echo -e "${YELLOW}Pre-flight checklist:${NC}"
echo "  [1] Keyfile exists: ${GREEN}OK${NC}"

if docker ps | grep -q mongodb_local; then
    echo "  [2] Standalone running: ${GREEN}OK${NC}"
else
    echo -e "  [2] Standalone running: ${RED}NOT RUNNING${NC}"
    echo "Start with: docker compose -f mongo.yml up -d"
    exit 1
fi

echo ""
echo -e "${YELLOW}This migration will:${NC}"
echo "  1. Stop the standalone MongoDB (mongodb_local)"
echo "  2. Start 3-node replica set using the same data volume"
echo "  3. Initialize replica set with primary + 2 secondaries"
echo ""
echo -e "${RED}Estimated downtime: 2-5 minutes${NC}"
echo ""
read -p "Ready to proceed? (yes/no): " proceed

if [ "$proceed" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Step 1/4: Stopping standalone MongoDB...${NC}"
cd "$PROJECT_DIR"
docker compose -f mongo.yml down
echo -e "${GREEN}Standalone stopped.${NC}"

echo ""
echo -e "${BLUE}Step 2/4: Starting replica set nodes...${NC}"
docker compose -f mongo-rs.yml up -d mongodb_primary mongodb_secondary1 mongodb_secondary2
echo "Waiting for nodes to start..."
sleep 15

echo ""
echo -e "${BLUE}Step 3/4: Initializing replica set...${NC}"
docker compose -f mongo-rs.yml up mongo_init

echo ""
echo -e "${BLUE}Step 4/4: Verifying replica set...${NC}"
sleep 5
docker exec mongodb_primary mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"

echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}   Migration Complete!                         ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo "Replica set is now running:"
echo "  Primary:    localhost:1010"
echo "  Secondary1: localhost:1012"
echo "  Secondary2: localhost:1013"
echo ""
echo "Connection string for apps:"
echo "  mongodb://user:pass@localhost:1010,localhost:1012,localhost:1013/?replicaSet=rs0&authSource=admin"
echo ""
echo -e "${YELLOW}Note: Update your application connection strings to include all nodes.${NC}"
