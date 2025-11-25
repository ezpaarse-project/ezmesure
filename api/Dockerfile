FROM node:24.4.1-alpine3.22 AS base

WORKDIR /app

# ---

FROM base AS prisma

COPY package*.json prisma.config.js ./
COPY prisma ./prisma

RUN npm ci && \
  npx prisma generate

# ---

FROM base AS dependencies

COPY package*.json ./

RUN NODE_ENV=production npm ci --omit=dev

# ---

FROM base
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

WORKDIR /usr/src/app

COPY --chown=node:node . .
COPY --chown=node:node --from=prisma /app/lib/.prisma ./lib/.prisma
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

EXPOSE 3000

ENTRYPOINT ["npm", "start"]
