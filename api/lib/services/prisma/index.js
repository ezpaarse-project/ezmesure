const { PrismaClient, Prisma, HarvestJobStatus } = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),

  enums: {
    HarvestJobStatus,
  },

  PrismaErrors: {
    UniqueContraintViolation: 'P2002',
    RecordNotFound: 'P2025',
  },
};
