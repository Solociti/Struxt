FROM node:20.18 AS build

WORKDIR /app
# expose the port
EXPOSE 3000

RUN npm i -g tsx