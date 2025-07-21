FROM node:22.17.1-alpine3.22 as dependencies

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# "npm ci" is needed so that prisma can run "prisma generate"
RUN npm ci && NODE_ENV=production npm ci --omit=dev


FROM node:22.17.1-alpine3.22
LABEL maintainer="ezTEAM <ezteam@couperin.org>"

WORKDIR /usr/src/app
COPY --chown=node:node . .
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
EXPOSE 3000

ENTRYPOINT ["npm", "start"]
