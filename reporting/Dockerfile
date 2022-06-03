FROM node:16.15.0-alpine3.14
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

# Installs latest Chromium (89) package.
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  dumb-init

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD [ "npm", "start" ]
