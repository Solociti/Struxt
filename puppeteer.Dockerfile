FROM node:24.11.1 AS dev

# Configure default locale (important for chrome-headless-shell).
ENV LANG=en_US.UTF-8

# Install dependencies for Chrome + Puppeteer.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
  fonts-kacst fonts-freefont-ttf dbus dbus-x11

# Add node user to additional groups
RUN usermod -a -G audio,video node

USER node

ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:

WORKDIR /app

# copy the build output from the shared build image
COPY --from=ghcr.io/solociti/struxt-build:build /app/node_modules ./node_modules
COPY --from=ghcr.io/solociti/struxt-build:build /app/puppeteer-package.json ./package.json
COPY --from=ghcr.io/solociti/struxt-build:build /app/client/dist ./client/dist
COPY --from=ghcr.io/solociti/struxt-build:build /app/dist-server ./
COPY --from=ghcr.io/solociti/struxt-build:build /app/templates ./templates/

# Install system dependencies as root.
USER root
RUN PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer \
  npx puppeteer browsers install chrome --install-deps

# switch back to node user
USER node

EXPOSE 3000

CMD ["node", "server/puppeteerEntry.js"]