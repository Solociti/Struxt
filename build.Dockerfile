FROM node:24.11.1 AS build

WORKDIR /app

# setup the build
COPY package.json /app
COPY scripts /app/scripts
COPY build.Dockerfile /app
RUN npm install

# copy the source code
COPY . /app/

RUN npm run build
RUN node copyDockerPackageJson.js

# running typescript to check for errors
RUN npx tsc -p server/tsconfig.json

# build the server and common directories
RUN npx babel server --out-dir dist-server/server --extensions '.ts,.js'
RUN npx babel common --out-dir dist-server/common --extensions '.ts,.js'

# rerun the npm install to only include production dependencies
RUN npm prune --omit=dev
