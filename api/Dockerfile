FROM node:14.17.1-alpine3.13
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["node", "server.js"]
