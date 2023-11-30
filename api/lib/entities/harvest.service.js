// @ts-check
const harvestPrisma = require('../services/prisma/harvest');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Harvest} Harvest */
/** @typedef {import('@prisma/client').Prisma.HarvestUpdateArgs} HarvestUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestUpsertArgs} HarvestUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestCreateArgs} HarvestCreateArgs */
/* eslint-enable max-len */

module.exports = class HarvestsService {
  /**
   * @param {HarvestCreateArgs} params
   * @returns {Promise<Harvest>}
   */
  static create(params) {
    return harvestPrisma.create(params);
  }

  /**
   * @param {HarvestFindManyArgs} params
   * @returns {Promise<Harvest[]>}
   */
  static findMany(params) {
    return harvestPrisma.findMany(params);
  }

  /**
   * @param {HarvestFindUniqueArgs} params
   * @returns {Promise<Harvest | null>}
   */
  static findUnique(params) {
    return harvestPrisma.findUnique(params);
  }

  /**
   * @param {HarvestUpdateArgs} params
   * @returns {Promise<Harvest>}
   */
  static update(params) {
    return harvestPrisma.update(params);
  }

  /**
   * @param {HarvestUpsertArgs} params
   * @returns {Promise<Harvest>}
   */
  static upsert(params) {
    return harvestPrisma.upsert(params);
  }
};
