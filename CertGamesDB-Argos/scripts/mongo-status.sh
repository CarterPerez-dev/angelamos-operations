#!/bin/bash
# AngelaMos | 2026
# Check MongoDB Replica Set Status

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}MongoDB Status Check${NC}"
echo "===================="
echo ""

check_container() {
    local name="$1"
    local port="$2"

    if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
        echo -e "  $name: ${GREEN}RUNNING${NC} (port $port)"
        return 0
    else
        echo -e "  $name: ${RED}STOPPED${NC}"
        return 1
    fi
}

echo -e "${YELLOW}Containers:${NC}"

if check_container "mongodb_local" "1010"; then
    MODE="standalone"
elif check_container "mongodb_primary" "1010"; then
    MODE="replica_set"
    check_container "mongodb_secondary1" "1012"
    check_container "mongodb_secondary2" "1013"
else
    echo -e "  ${RED}No MongoDB containers running${NC}"
    exit 1
fi

check_container "mongodb_dev" "1011" || true

echo ""

if [ "$MODE" = "replica_set" ]; then
    echo -e "${YELLOW}Replica Set Status:${NC}"

    if [ -z "$MONGO_USER" ] || [ -z "$MONGO_PASSWORD" ]; then
        source "$(dirname "$0")/../.env" 2>/dev/null || true
    fi

    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASSWORD" ]; then
        docker exec mongodb_primary mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" \
            --authenticationDatabase admin --quiet \
            --eval "
                const status = rs.status();
                print('  Set Name: ' + status.set);
                status.members.forEach(m => {
                    const state = m.stateStr;
                    const health = m.health === 1 ? 'healthy' : 'unhealthy';
                    print('  ' + m.name + ': ' + state + ' (' + health + ')');
                });
            " 2>/dev/null || echo "  Could not connect to check status"
    else
        echo "  Set MONGO_USER and MONGO_PASSWORD to check replica set status"
    fi
elif [ "$MODE" = "standalone" ]; then
    echo -e "${YELLOW}Mode: Standalone${NC}"
fi

echo ""
echo -e "${YELLOW}Volumes:${NC}"
docker volume ls --format '{{.Name}}' | grep -i mongo | while read vol; do
    size=$(docker system df -v 2>/dev/null | grep "$vol" | awk '{print $4}' || echo "unknown")
    echo "  $vol"
done

echo ""
