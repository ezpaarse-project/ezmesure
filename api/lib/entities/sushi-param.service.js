// @ts-check
const { client: prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SushiParameter} SushiParameter */
/** @typedef {import('@prisma/client').Prisma.SushiParameterUpdateArgs} SushiParameterUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SushiParameterUpsertArgs} SushiParameterUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SushiParameterFindUniqueArgs} SushiParameterFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SushiParameterFindManyArgs} SushiParameterFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SushiParameterCreateArgs} SushiParameterCreateArgs */
/* eslint-enable max-len */

module.exports = class SushiParametersService {
  /**
   * @param {SushiParameterCreateArgs} params
   * @returns {Promise<SushiParameter>}
   */
  static create(params) {
    return prisma.sushiParameter.create(params);
  }

  /**
   * @param {SushiParameterFindManyArgs} params
   * @returns {Promise<SushiParameter[]>}
   */
  static findMany(params) {
    return prisma.sushiParameter.findMany(params);
  }

  /**
   * @param {SushiParameterFindUniqueArgs} params
   * @returns {Promise<SushiParameter | null>}
   */
  static findUnique(params) {
    return prisma.sushiParameter.findUnique(params);
  }

  /**
   * @param {SushiParameterUpdateArgs} params
   * @returns {Promise<SushiParameter>}
   */
  static update(params) {
    return prisma.sushiParameter.update(params);
  }

  /**
   * @param {SushiParameterUpsertArgs} params
   * @returns {Promise<SushiParameter>}
   */
  static upsert(params) {
    return prisma.sushiParameter.upsert(params);
  }
};
