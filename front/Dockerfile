FROM node:18.18.2-alpine3.18 as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && NODE_ENV=production npm ci --omit=dev


FROM node:18.18.2-alpine3.18
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

RUN \
    apk add --no-cache python2 build-base

WORKDIR /usr/src/app
COPY --chown=node:node --from=builder /app .

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
