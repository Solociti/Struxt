FROM node:22.21.1 AS prod

WORKDIR /app

# copy the build output from the shared build image
COPY --from=ghcr.io/solociti/struxt-build:build /app/node_modules ./node_modules
COPY --from=ghcr.io/solociti/struxt-build:build /app/docker-package.json ./package.json
COPY --from=ghcr.io/solociti/struxt-build:build /app/client/dist ./client/dist
COPY --from=ghcr.io/solociti/struxt-build:build /app/dist-server ./
COPY --from=ghcr.io/solociti/struxt-build:build /app/templates ./templates/

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
  && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# expose the port
EXPOSE 3000

# start the app
CMD ["node", "server/apiEntry.js"]