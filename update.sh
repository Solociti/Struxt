#!/bin/bash

git fetch --prune
git pull

node envSetup.js

docker compose --profile prod build
docker compose --profile prod up -d