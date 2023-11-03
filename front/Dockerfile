FROM node:14-alpine3.13
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

RUN \
    apk add --no-cache python2 build-base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

RUN npm run build

ENTRYPOINT ["npm", "start"]
