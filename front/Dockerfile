FROM node:18.14.2-alpine3.16 as builder

WORKDIR /app

COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build && NODE_ENV=production npm ci --omit=dev


FROM node:18.14.2-alpine3.16
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

WORKDIR /usr/src/app
COPY --chown=node:node --from=builder /app .

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
