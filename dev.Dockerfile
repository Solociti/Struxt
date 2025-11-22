FROM node:22.21.1 AS build

WORKDIR /app

# expose the port
EXPOSE 3000
EXPOSE 9228

RUN npm i -g nodemon
