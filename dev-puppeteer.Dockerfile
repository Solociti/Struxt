FROM ghcr.io/puppeteer/puppeteer:16.1.0 AS prod


WORKDIR /app

# expose the port
EXPOSE 3000
EXPOSE 9228

USER root
RUN npm i -g nodemon
USER pptruser
