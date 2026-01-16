#!/bin/bash
# AngelaMos | 2026
# MongoDB Dangerous Operations - Requires explicit confirmation

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

confirm_danger() {
    local action="$1"
    local target="$2"

    echo -e "${RED}===============================================${NC}"
    echo -e "${RED}        DANGEROUS OPERATION WARNING           ${NC}"
    echo -e "${RED}===============================================${NC}"
    echo ""
    echo -e "Action: ${YELLOW}$action${NC}"
    echo -e "Target: ${YELLOW}$target${NC}"
    echo ""
    echo -e "${RED}This action is IRREVERSIBLE and may cause DATA LOSS.${NC}"
    echo ""
    read -p "Type 'YES I UNDERSTAND' to proceed: " confirmation

    if [ "$confirmation" != "YES I UNDERSTAND" ]; then
        echo -e "${GREEN}Operation cancelled.${NC}"
        exit 1
    fi
}

case "$1" in
    "delete-volume")
        if [ -z "$2" ]; then
            echo "Usage: $0 delete-volume <volume-name>"
            exit 1
        fi

        if [[ "$2" == *"mongo_data"* ]]; then
            confirm_danger "DELETE VOLUME" "$2"
            echo ""
            read -p "Type the volume name again to confirm: " volume_confirm
            if [ "$volume_confirm" != "$2" ]; then
                echo -e "${GREEN}Volume names don't match. Operation cancelled.${NC}"
                exit 1
            fi
        fi

        docker volume rm "$2"
        echo -e "${GREEN}Volume $2 deleted.${NC}"
        ;;

    "prune-volumes")
        confirm_danger "PRUNE ALL UNUSED VOLUMES" "all unused Docker volumes"
        docker volume prune -f
        ;;

    "reset-replica-set")
        confirm_danger "RESET REPLICA SET" "all MongoDB replica set data"
        echo "Stopping containers..."
        docker compose -f mongo-rs.yml down
        echo "Removing secondary volumes..."
        docker volume rm oneisnun__mongo_data_secondary1 2>/dev/null || true
        docker volume rm oneisnun__mongo_data_secondary2 2>/dev/null || true
        docker volume rm oneisnun__mongo_config_secondary1 2>/dev/null || true
        docker volume rm oneisnun__mongo_config_secondary2 2>/dev/null || true
        echo -e "${GREEN}Replica set reset. Primary data preserved.${NC}"
        ;;

    "nuke-dev")
        confirm_danger "DELETE DEV DATABASE" "all development MongoDB data"
        docker compose -f mongo-dev.yml down -v
        echo -e "${GREEN}Dev database nuked.${NC}"
        ;;

    *)
        echo "MongoDB Danger Zone Commands"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  delete-volume <name>  - Delete a specific Docker volume"
        echo "  prune-volumes         - Remove all unused Docker volumes"
        echo "  reset-replica-set     - Reset replica set (keeps primary data)"
        echo "  nuke-dev              - Completely remove dev database"
        echo ""
        echo "All commands require explicit confirmation."
        ;;
esac
