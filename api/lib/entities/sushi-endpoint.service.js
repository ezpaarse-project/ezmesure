// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpdateArgs} SushiEndpointUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpsertArgs} SushiEndpointUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindUniqueArgs} SushiEndpointFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindManyArgs} SushiEndpointFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointCreateArgs} SushiEndpointCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointDeleteArgs} SushiEndpointDeleteArgs */
/* eslint-enable max-len */

module.exports = class SushiEndpointsService {
  /**
   * @param {SushiEndpointCreateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  static create(params) {
    return prisma.sushiEndpoint.create(params);
  }

  /**
   * @param {SushiEndpointFindManyArgs} params
   * @returns {Promise<SushiEndpoint[]>}
   */
  static findMany(params) {
    return prisma.sushiEndpoint.findMany(params);
  }

  /**
   * @param {SushiEndpointFindUniqueArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  static findUnique(params) {
    return prisma.sushiEndpoint.findUnique(params);
  }

  /**
   * @param {SushiEndpointUpdateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  static update(params) {
    return prisma.sushiEndpoint.update(params);
  }

  /**
   * @param {SushiEndpointUpsertArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  static upsert(params) {
    return prisma.sushiEndpoint.upsert(params);
  }

  /**
   * @param {SushiEndpointDeleteArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  static delete(params) {
    return prisma.sushiEndpoint.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};