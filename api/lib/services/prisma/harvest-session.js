// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client').HarvestSession} HarvestSession
 * @typedef {import('../../.prisma/client').Prisma.TransactionClient} TransactionClient
 *
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionUpdateArgs} HarvestSessionUpdateArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionUpsertArgs} HarvestSessionUpsertArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionDeleteArgs} HarvestSessionDeleteArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionDeleteManyArgs} HarvestSessionDeleteManyArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionFindUniqueArgs} HarvestSessionFindUniqueArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionFindFirstArgs} HarvestSessionFindFirstArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionFindManyArgs} HarvestSessionFindManyArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionAggregateArgs} HarvestSessionAggregateArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionCountArgs} HarvestSessionCountArgs
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionCreateArgs} HarvestSessionCreateArgs
 *
 * @typedef {import('../../.prisma/client').Prisma.HarvestSessionGetPayload<{ include: { jobs: true } }>} OldSession
 *
 * @typedef {{deleteResult: HarvestSession, deletedSession: OldSession }} SessionRemoved
 */
/* eslint-enable max-len */

/**
 * @param {HarvestSessionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession>}
 */
function create(params, tx = prisma) {
  return tx.harvestSession.create(params);
}

/**
 * @param {HarvestSessionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession[]>}
 */
function findMany(params, tx = prisma) {
  return tx.harvestSession.findMany(params);
}

/**
 * @param {HarvestSessionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.harvestSession.findUnique(params);
}

/**
 * @param {HarvestSessionFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.harvestSession.findFirst(params);
}

/**
 * @param {HarvestSessionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.harvestSession.count(params);
}

/**
 * @param {HarvestSessionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession>}
 */
function update(params, tx = prisma) {
  return tx.harvestSession.update(params);
}

/**
 * @param {HarvestSessionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<HarvestSession>}
 */
function upsert(params, tx = prisma) {
  return tx.harvestSession.upsert(params);
}

/**
 * @param {HarvestSessionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SessionRemoved | null>}
 */
async function remove(params, tx = prisma) {
  const session = await tx.harvestSession.findUnique({
    where: params.where,
    include: {
      jobs: true,
    },
  });

  if (!session) {
    return null;
  }

  return {
    deleteResult: await tx.harvestSession.delete(params),
    deletedSession: session,
  };
}

/**
 * @param {HarvestSessionDeleteManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<{ count: number }>}
 */
function removeMany(params, tx = prisma) {
  return tx.harvestSession.deleteMany(params);
}

/**
 * @param {TransactionClient} [tx]
 * @returns {Promise<Array<HarvestSession> | null>}
 */
async function removeAll(tx) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  /** @param {TransactionClient} txx */
  const processor = async (txx) => {
    const harvestSessions = await findMany({}, txx);

    if (harvestSessions.length === 0) { return null; }

    await Promise.all(
      harvestSessions.map(
        (harvestSession) => remove(
          {
            where: {
              id: harvestSession.id,
            },
          },
          txx,
        ),
      ),
    );

    return harvestSessions;
  };

  if (tx) {
    return processor(tx);
  }
  return prisma.$transaction(processor);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  count,
  update,
  upsert,
  remove,
  removeMany,
  removeAll,
};
