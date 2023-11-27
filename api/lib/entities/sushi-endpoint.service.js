// @ts-check
const { client: prisma } = require('../services/prisma.service');
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
  static async delete(params) {
    const [deleteResult, deletedEndpoint] = await prisma.$transaction(async (tx) => {
      const endpoint = await tx.sushiEndpoint.findUnique({
        where: params.where,
        include: {
          credentials: true,
        },
      });

      if (!endpoint) {
        return [null, null];
      }

      await tx.sushiCredentials.deleteMany({
        where: { endpointId: endpoint.id },
      });

      return [
        await tx.sushiEndpoint.delete(params),
        endpoint,
      ];
    });

    if (!deletedEndpoint) {
      return null;
    }

    triggerHooks('sushi_endpoint:delete', deletedEndpoint);
    deletedEndpoint.credentials.forEach((credentials) => { triggerHooks('sushi_credentials:delete', credentials); });

    return deleteResult;
  }
};
