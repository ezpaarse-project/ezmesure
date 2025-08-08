const {
  PrismaClient,
  Prisma,
  HarvestJobStatus,
  HarvestSessionStatus,
  SushiAlertType,
} = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),

  enums: {
    HarvestJobStatus,
    HarvestSessionStatus,
    SushiAlertType,
  },

  PrismaErrors: {
    UniqueContraintViolation: 'P2002',
    RecordNotFound: 'P2025',
  },
};
