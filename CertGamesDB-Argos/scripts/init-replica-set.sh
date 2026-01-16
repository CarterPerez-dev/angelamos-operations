#!/bin/bash
# AngelaMos | 2026
# Initialize MongoDB Replica Set

set -e

echo "Waiting for all MongoDB nodes to be ready..."
sleep 10

echo "Initializing replica set..."

mongosh --host mongodb_primary:27017 -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb_primary:27017", priority: 2 },
    { _id: 1, host: "mongodb_secondary1:27017", priority: 1 },
    { _id: 2, host: "mongodb_secondary2:27017", priority: 1 }
  ]
})
EOF

echo "Waiting for replica set to elect primary..."
sleep 15

echo "Checking replica set status..."
mongosh --host mongodb_primary:27017 -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "rs.status()"

echo "Replica set initialization complete!"
