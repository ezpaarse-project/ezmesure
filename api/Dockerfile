FROM node:6.9.4-wheezy
MAINTAINER ezTEAM <ezpaarse@couperin.org>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install yarn
RUN apt-get update && apt-get install -y apt-transport-https
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y yarn

COPY package.json /usr/src/app/
RUN yarn install && yarn cache clean
COPY . /usr/src/app

ENTRYPOINT [ "node", "./server.js" ]
