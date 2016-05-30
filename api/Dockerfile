FROM node:4-wheezy
MAINTAINER ezTEAM <ezpaarse@couperin.org>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

CMD [ "npm", "start" ]
