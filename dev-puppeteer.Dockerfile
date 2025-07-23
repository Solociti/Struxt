FROM node:22.17  AS dev

# Configure default locale (important for chrome-headless-shell).
ENV LANG=en_US.UTF-8

# Install dependencies for Chrome + Puppeteer.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
  fonts-kacst fonts-freefont-ttf dbus dbus-x11

# Add node user to additional groups
RUN usermod -a -G audio,video node

USER node

WORKDIR /home/node

ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:

# install puppeteer package
RUN npm i puppeteer@24.14.0

# Install system dependencies as root.
USER root
RUN PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer \
  npx puppeteer browsers install chrome --install-deps

RUN npm i -g nodemon

USER node

WORKDIR /app

# expose the port
EXPOSE 3000
EXPOSE 9228

