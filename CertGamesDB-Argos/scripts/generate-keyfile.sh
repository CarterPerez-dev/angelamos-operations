#!/bin/bash
# AngelaMos | 2026
# Generate MongoDB Replica Set Keyfile

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYFILE="$SCRIPT_DIR/keyfile"

if [ -f "$KEYFILE" ]; then
    echo "Keyfile already exists at $KEYFILE"
    echo "Delete it first if you want to regenerate."
    exit 1
fi

echo "Generating keyfile for MongoDB replica set authentication..."

openssl rand -base64 756 > "$KEYFILE"

chmod 400 "$KEYFILE"

echo "Keyfile generated at $KEYFILE"
echo "Permissions set to 400 (read-only for owner)"
