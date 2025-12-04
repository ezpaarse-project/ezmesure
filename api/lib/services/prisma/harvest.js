// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').Harvest} Harvest
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestUpdateArgs} HarvestUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestUpsertArgs} HarvestUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestFindFirstArgs} HarvestFindFirstArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestCountArgs} HarvestCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestCreateArgs} HarvestCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestDeleteManyArgs} HarvestDeleteManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestGroupByArgs} HarvestGroupByArgs
 */
/* eslint-enable max-len */

/**
 * @param {HarvestCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest>}
 */
function create(params, tx = prisma) {
  return tx.harvest.create(params);
}

/**
 * @param {HarvestFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest[]>}
 */
function findMany(params, tx = prisma) {
  return tx.harvest.findMany(params);
}

/**
 * @param {HarvestFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.harvest.findUnique(params);
}

/**
 * @param {HarvestFindFirstArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest | null>}
 */
function findFirst(params, tx = prisma) {
  return tx.harvest.findFirst(params);
}

/**
 * @param {HarvestCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.harvest.count(params);
}

/**
 * @param {HarvestUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest>}
 */
function update(params, tx = prisma) {
  return tx.harvest.update(params);
}

/**
 * @param {HarvestUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<Harvest>}
 */
function upsert(params, tx = prisma) {
  return tx.harvest.upsert(params);
}

/**
 * @param {HarvestGroupByArgs} params
 * @param {TransactionClient} [tx]
 * @returns
 */
function groupBy(params, tx = prisma) {
  // @ts-ignore
  return tx.harvest.groupBy(params);
}

/**
 * @param {HarvestDeleteManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
async function removeMany(params, tx = prisma) {
  const { count: c } = await tx.harvest.deleteMany(params);
  return c;
}

module.exports = {
  create,
  findMany,
  findFirst,
  findUnique,
  count,
  update,
  upsert,
  groupBy,
  removeMany,
};
