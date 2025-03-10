# Allows the following commands to be easily run with this file
# up, down, restart, logs, ps

# Check if .env file exists
if [ -f .env ]; then
  # Extract NODE_ENV value from .env file
  NODE_ENV=$(grep -E "^NODE_ENV=" .env | cut -d= -f2 | tr -d '"' | tr -d "'")
  
  # Default to development if NODE_ENV is not set
  if [ -z "$NODE_ENV" ]; then
    echo "NODE_ENV not found in .env file, defaulting to development"
    NODE_ENV="development"
  fi
else
  echo ".env file not found, defaulting to development"
  NODE_ENV="development"
fi

echo "Running in $NODE_ENV mode"

# Set the docker-compose file based on environment
if [ "$NODE_ENV" = "production" ]; then
  DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
else
  node copyDockerPackageJson.js
  DOCKER_COMPOSE_FILE="docker-compose.dev.yml"
fi

# Run docker compose with the specified file
docker compose -f docker-compose.yml -f $DOCKER_COMPOSE_FILE "$@"
