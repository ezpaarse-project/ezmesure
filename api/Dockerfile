FROM node:10.15.3-alpine
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

ENTRYPOINT ["node", "server.js"]
