FROM node:20.18 AS build

WORKDIR /app

# setup the build
COPY package.json /app
RUN npm install

# copy the source code
COPY . /app/

RUN npm run build
RUN node copyDockerPackageJson.js
RUN npx tsc -p server/tsconfig.json

FROM node:20.18 AS prod

# copy the build output to the runtime image
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/docker-package.json /app/package.json
COPY --from=build /app/dist /app/dist
COPY --from=build /app/dist-server /app

WORKDIR /app

# expose the port
EXPOSE 3000

# start the app
CMD ["node", "server/apiEntry.js"]