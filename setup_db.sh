#!/bin/bash

CONTAINER_NAME="cscs-postgres"
DB_NAME="dblp_db"
DB_USER="user"

echo "Checking if database '$DB_NAME' exists inside container '$CONTAINER_NAME'..."

DB_EXISTS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)

if [ "$DB_EXISTS" == "1" ]; then
    echo "DB '$DB_NAME' already exists."
else
    echo "Creating DB '$DB_NAME' inside container..."
    docker exec $CONTAINER_NAME createdb -U $DB_USER $DB_NAME
fi

echo "Executing DDL (schema.sql)..."
cat schema.sql | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

echo "Database setup complete."