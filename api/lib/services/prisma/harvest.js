// @ts-check
const { client: prisma } = require('./index');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Harvest} Harvest */
/** @typedef {import('@prisma/client').Prisma.HarvestUpdateArgs} HarvestUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestUpsertArgs} HarvestUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestCreateArgs} HarvestCreateArgs */
/* eslint-enable max-len */

/**
 * @param {HarvestCreateArgs} params
 * @returns {Promise<Harvest>}
 */
function create(params) {
  return prisma.harvest.create(params);
}

/**
 * @param {HarvestFindManyArgs} params
 * @returns {Promise<Harvest[]>}
 */
function findMany(params) {
  return prisma.harvest.findMany(params);
}

/**
 * @param {HarvestFindUniqueArgs} params
 * @returns {Promise<Harvest | null>}
 */
function findUnique(params) {
  return prisma.harvest.findUnique(params);
}

/**
 * @param {HarvestUpdateArgs} params
 * @returns {Promise<Harvest>}
 */
function update(params) {
  return prisma.harvest.update(params);
}

/**
 * @param {HarvestUpsertArgs} params
 * @returns {Promise<Harvest>}
 */
function upsert(params) {
  return prisma.harvest.upsert(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  update,
  upsert,
};
