const { PrismaPg } = require('@prisma/adapter-pg');

const {
  PrismaClient,
  Prisma,
  HarvestJobStatus,
  HarvestSessionStatus,
  SushiAlertType,
} = require('../../.prisma/client.ts');

const DATABASE_URL = new URL(process.env.EZMESURE_POSTGRES_URL ?? '');

module.exports = {
  Prisma,
  client: new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: DATABASE_URL.href },
      { schema: DATABASE_URL.searchParams.get('schema') || undefined },
    ),
    // Disable formatted errors in production
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  }),

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
