// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').SpaceDashboardCollection} SpaceDashboardCollection
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionUpdateArgs} SpaceDashboardCollectionUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionUpsertArgs} SpaceDashboardCollectionUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionCountArgs} SpaceDashboardCollectionCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionFindUniqueArgs} SpaceDashboardCollectionFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionFindFirstArgs} SpaceDashboardCollectionFindFirstArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionFindManyArgs} SpaceDashboardCollectionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionCreateArgs} SpaceDashboardCollectionCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionDeleteArgs} SpaceDashboardCollectionDeleteArgs
 */
/* eslint-enable max-len */

/**
 * @param {SpaceDashboardCollectionCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection>}
 */
function create(params, tx = prisma) {
  return tx.spaceDashboardCollection.create(params);
}

/**
 * @param {SpaceDashboardCollectionFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection[]>}
 */
function findMany(params, tx = prisma) {
  return tx.spaceDashboardCollection.findMany(params);
}

/**
 * @param {SpaceDashboardCollectionFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.spaceDashboardCollection.findUnique(params);
}

/**
 * @param {SpaceDashboardCollectionFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.spaceDashboardCollection.findFirst(params);
}

/**
 * @param {SpaceDashboardCollectionUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection>}
 */
function update(params, tx = prisma) {
  return tx.spaceDashboardCollection.update(params);
}

/**
 * @param {SpaceDashboardCollectionUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection>}
 */
function upsert(params, tx = prisma) {
  return tx.spaceDashboardCollection.upsert(params);
}

/**
 * @param {SpaceDashboardCollectionCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.spaceDashboardCollection.count(params);
}

/**
 * @param {SpaceDashboardCollectionDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<SpaceDashboardCollection | null>}
 */
async function remove(params, tx = prisma) {
  /** @param {TransactionClient} txx */
  const transaction = async (txx) => {
    const spaceCollection = await txx.spaceDashboardCollection.findUnique({
      where: params.where,
    });

    if (!spaceCollection) {
      return null;
    }

    return txx.spaceDashboardCollection.delete(params);
  };

  if (tx) { return transaction(tx); }

  return prisma.$transaction(transaction);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findFirst,
  update,
  upsert,
  count,
  remove,
};
