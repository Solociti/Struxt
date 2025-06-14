FROM ghcr.io/puppeteer/puppeteer:16.1.0 AS prod

# Switch to root for setup
USER root

WORKDIR /app

# copy the build output from the shared build image
COPY --from=struxt-build:build /app/node_modules ./node_modules
COPY --from=struxt-build:build /app/puppeteer-package.json ./package.json
COPY --from=struxt-build:build /app/client/dist ./client/dist
COPY --from=struxt-build:build /app/dist-server ./
COPY --from=struxt-build:build /app/templates ./templates/

# Change ownership to pptruser (already exists in Puppeteer image)
RUN chown -R pptruser:pptruser /app
USER pptruser

EXPOSE 3000

CMD ["node", "server/apiEntry.js"]