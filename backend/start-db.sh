#!/bin/bash
# Helper script to start the Unified Office Management System database

echo "🚀 Starting database container 'office_db'..."
docker compose up -d db

echo "⏳ Waiting for database to be ready..."
until docker exec office_db pg_isready -U postgres > /dev/null 2>&1; do
  echo -n "."
  sleep 1
done

echo -e "\n✅ Database is up and running on port 5432!"
