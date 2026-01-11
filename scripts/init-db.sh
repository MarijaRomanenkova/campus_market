#!/bin/sh

# Wait for the database to be ready
echo "Waiting for database to be ready..."
while ! npx prisma db push; do
  echo "Database not ready yet... waiting"
  sleep 2
done

echo "Database is ready!"

# Check if database is empty by counting users
USER_COUNT=$(npx prisma db execute --schema=./prisma/schema.prisma --stdin << EOF
SELECT COUNT(*) as count FROM "User";
EOF
)

# Extract just the number from the result
USER_COUNT=$(echo "$USER_COUNT" | grep -o '[0-9]*' | head -1)

echo "User count: $USER_COUNT"

# If USER_COUNT is empty or 0, seed the database
if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
  echo "Database is empty. Seeding..."
  cd /app && node db/seed.mjs
else
  echo "Database already has data. Skipping seeding..."
fi

echo "Database initialization completed!" 
 