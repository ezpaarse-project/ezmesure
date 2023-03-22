// @ts-check
const prisma = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').HarvestRequest} HarvestRequest */
/** @typedef {import('@prisma/client').Prisma.HarvestRequestUpdateArgs} HarvestRequestUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestRequestUpsertArgs} HarvestRequestUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestRequestFindUniqueArgs} HarvestRequestFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestRequestFindManyArgs} HarvestRequestFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestRequestCreateArgs} HarvestRequestCreateArgs */
/* eslint-enable max-len */

module.exports = class HarvestRequestsService {
  /**
   * @param {HarvestRequestCreateArgs} params
   * @returns {Promise<HarvestRequest>}
   */
  static create(params) {
    return prisma.harvestRequest.create(params);
  }

  /**
   * @param {HarvestRequestFindManyArgs} params
   * @returns {Promise<HarvestRequest[]>}
   */
  static findMany(params) {
    return prisma.harvestRequest.findMany(params);
  }

  /**
   * @param {HarvestRequestFindUniqueArgs} params
   * @returns {Promise<HarvestRequest | null>}
   */
  static findUnique(params) {
    return prisma.harvestRequest.findUnique(params);
  }

  /**
   * @param {HarvestRequestUpdateArgs} params
   * @returns {Promise<HarvestRequest>}
   */
  static update(params) {
    return prisma.harvestRequest.update(params);
  }

  /**
   * @param {HarvestRequestUpsertArgs} params
   * @returns {Promise<HarvestRequest>}
   */
  static upsert(params) {
    return prisma.harvestRequest.upsert(params);
  }
};
