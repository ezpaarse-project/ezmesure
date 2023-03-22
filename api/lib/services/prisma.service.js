const { PrismaClient, Prisma } = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),
};
