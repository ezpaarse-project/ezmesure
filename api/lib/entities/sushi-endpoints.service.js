// @ts-check
const sushiEndpointsPrisma = require('../services/prisma/sushi-endpoints');
const BasePrismaService = require('./base-prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpdateArgs} SushiEndpointUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointUpsertArgs} SushiEndpointUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointCountArgs} SushiEndpointCountArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindUniqueArgs} SushiEndpointFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointFindManyArgs} SushiEndpointFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointCreateArgs} SushiEndpointCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiEndpointDeleteArgs} SushiEndpointDeleteArgs */
/* eslint-enable max-len */

module.exports = class SushiEndpointsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SushiEndpointsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SushiEndpointCreateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  create(params) {
    return sushiEndpointsPrisma.create(params, this.prisma);
  }

  /**
   * @param {SushiEndpointFindManyArgs} params
   * @returns {Promise<SushiEndpoint[]>}
   */
  findMany(params) {
    return sushiEndpointsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SushiEndpointFindUniqueArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  findUnique(params) {
    return sushiEndpointsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiEndpoint | null>}
   */
  findByID(id) {
    return sushiEndpointsPrisma.findByID(id, this.prisma);
  }

  /**
   * @param {SushiEndpointUpdateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  update(params) {
    return sushiEndpointsPrisma.update(params, this.prisma);
  }

  /**
   * @param {SushiEndpointUpsertArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  upsert(params) {
    return sushiEndpointsPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {SushiEndpointCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return sushiEndpointsPrisma.count(params, this.prisma);
  }

  /**
   * @param {SushiEndpointDeleteArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  async delete(params) {
    const result = await sushiEndpointsPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    const { deleteResult, deletedEndpoint } = result;

    this.triggerHooks('sushi_endpoint:delete', deletedEndpoint);
    deletedEndpoint.credentials.forEach((credentials) => { this.triggerHooks('sushi_credentials:delete', credentials); });
    return deleteResult;
  }

  /**
   * @returns {Promise<Array<SushiEndpoint> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SushiEndpointsService} service */
    const transaction = async (service) => {
      const sushiEndpoints = await service.findMany({});

      if (sushiEndpoints.length === 0) { return null; }

      await Promise.all(
        sushiEndpoints.map(
          (sushiEndpoint) => service.delete({
            where: {
              id: sushiEndpoint.id,
            },
          }),
        ),
      );

      return sushiEndpoints;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return SushiEndpointsService.$transaction(transaction);
  }
};
