// @ts-check
const sushiEndpointsPrisma = require('../services/prisma/sushi-endpoints');
const { triggerHooks } = require('../hooks/hookEmitter');

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
    return sushiEndpointsPrisma.create(params);
  }

  /**
   * @param {SushiEndpointFindManyArgs} params
   * @returns {Promise<SushiEndpoint[]>}
   */
  static findMany(params) {
    return sushiEndpointsPrisma.findMany(params);
  }

  /**
   * @param {SushiEndpointFindUniqueArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  static findUnique(params) {
    return sushiEndpointsPrisma.findUnique(params);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiEndpoint | null>}
   */
  static findByID(id) {
    return sushiEndpointsPrisma.findUnique({ where: { id } });
  }

  /**
   * @param {SushiEndpointUpdateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  static update(params) {
    return sushiEndpointsPrisma.update(params);
  }

  /**
   * @param {SushiEndpointUpsertArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  static upsert(params) {
    return sushiEndpointsPrisma.upsert(params);
  }

  /**
   * @param {SushiEndpointDeleteArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  static async delete(params) {
    const { deleteResult, deletedEndpoint } = await sushiEndpointsPrisma.remove(params);

    triggerHooks('sushi_endpoint:delete', deletedEndpoint);
    deletedEndpoint.credentials.forEach((credentials) => { triggerHooks('sushi_credentials:delete', credentials); });

    return deleteResult;
  }

  /**
   * @returns {Promise<Array<SushiEndpoint> | null>}
   */
  static async removeAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const sushiEndpoints = await this.findMany({});

    await Promise.all(sushiEndpoints.map(async (sushiEndpoint) => {
      await this.delete({
        where: {
          id: sushiEndpoint.id,
        },
      });
    }));

    return sushiEndpoints;
  }
};
