// @ts-check
const { client: prisma } = require('../services/prisma.service');

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
    return prisma.harvest.create(params);
  }

  /**
   * @param {HarvestFindManyArgs} params
   * @returns {Promise<Harvest[]>}
   */
  static findMany(params) {
    return prisma.harvest.findMany(params);
  }

  /**
   * @param {HarvestFindUniqueArgs} params
   * @returns {Promise<Harvest | null>}
   */
  static findUnique(params) {
    return prisma.harvest.findUnique(params);
  }

  /**
   * @param {HarvestUpdateArgs} params
   * @returns {Promise<Harvest>}
   */
  static update(params) {
    return prisma.harvest.update(params);
  }

  /**
   * @param {HarvestUpsertArgs} params
   * @returns {Promise<Harvest>}
   */
  static upsert(params) {
    return prisma.harvest.upsert(params);
  }
};
