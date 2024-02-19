FROM node:18.18.2-alpine3.18 as dependencies

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# "npm ci" is needed so that prisma can run "prisma generate"
RUN npm ci && NODE_ENV=production npm ci --omit=dev


FROM node:18.18.2-alpine3.18
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

WORKDIR /usr/src/app
COPY --chown=node:node . .
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
EXPOSE 3000

ENTRYPOINT ["npm", "start"]
