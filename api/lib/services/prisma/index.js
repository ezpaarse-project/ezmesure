const {
  PrismaClient,
  Prisma,
  HarvestJobStatus,
  SushiAlertType,
} = require('@prisma/client');

module.exports = {
  Prisma,
  client: new PrismaClient(),

  enums: {
    HarvestJobStatus,
    SushiAlertType,
  },

  PrismaErrors: {
    UniqueContraintViolation: 'P2002',
    RecordNotFound: 'P2025',
  },
};
