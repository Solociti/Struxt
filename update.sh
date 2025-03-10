#!/bin/bash

git fetch --prune
git pull

node envSetup.js

./docker.sh build
./docker.sh up -d