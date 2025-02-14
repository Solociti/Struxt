#!/bin/bash

git fetch --prune
git pull

docker compose --profile prod build
docker compose --profile prod up -d