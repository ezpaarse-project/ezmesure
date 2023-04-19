const { PrismaClient, Prisma } = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),

  PrismaErrors: {
    UniqueContraintViolation: 'P2002',
    RecordNotFound: 'P2025',
  },
};
