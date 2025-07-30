const {
  PrismaClient,
  Prisma,
  HarvestJobStatus,
  HarvestSessionStatus,
} = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),

  enums: {
    HarvestJobStatus,
    HarvestSessionStatus,
  },

  PrismaErrors: {
    UniqueContraintViolation: 'P2002',
    RecordNotFound: 'P2025',
  },
};
