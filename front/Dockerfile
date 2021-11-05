FROM node:14.17.1-alpine3.13
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

RUN npm run build

ENTRYPOINT ["npm", "start"]
