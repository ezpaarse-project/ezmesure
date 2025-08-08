FROM node:24.4.1-alpine3.22 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---

FROM node:24.4.1-alpine3.22
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

WORKDIR /usr/src/app
COPY --chown=node:node --from=builder /app/.output .

EXPOSE 3000

ENTRYPOINT ["node", "server/index.mjs"]
