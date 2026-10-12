FROM node:24.20.0-alpine3.24 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run generate

# ---

FROM nginx:1.29.1-alpine-slim
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

COPY --from=builder /app/.output/public/ /www/data/

COPY ./nginx /etc/nginx/templates
