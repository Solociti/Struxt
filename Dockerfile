FROM node:20.18 AS build

WORKDIR /app

# setup the build
COPY package.json /app
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

FROM node:20.18 AS prod

# copy the build output to the runtime image
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/docker-package.json /app/package.json
COPY --from=build /app/migrations /app/migrations
COPY --from=build /app/knexfile.js /app/knexfile.js
COPY --from=build /app/client/dist /app/client/dist
COPY --from=build /app/dist-server /app

# copy template files
COPY --from=build /app/templates /app/templates/

WORKDIR /app

# expose the port
EXPOSE 3000

# start the app
CMD ["node", "server/apiEntry.js"]