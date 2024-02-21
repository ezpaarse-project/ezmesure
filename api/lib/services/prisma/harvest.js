// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Prisma.TransactionClient} TransactionClient */
/** @typedef {import('@prisma/client').Harvest} Harvest */
/** @typedef {import('@prisma/client').Prisma.HarvestUpdateArgs} HarvestUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestUpsertArgs} HarvestUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestCreateArgs} HarvestCreateArgs */
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

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
};
