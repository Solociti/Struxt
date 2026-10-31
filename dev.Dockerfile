FROM node:24.22.2 AS build

WORKDIR /app

# expose the port
EXPOSE 3000
EXPOSE 9228

RUN npm i -g nodemon
