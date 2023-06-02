// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Space} Space */
/** @typedef {import('@prisma/client').Prisma.SpaceUpdateArgs} SpaceUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceUpsertArgs} SpaceUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindUniqueArgs} SpaceFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindManyArgs} SpaceFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceCreateArgs} SpaceCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceDeleteArgs} SpaceDeleteArgs */
/* eslint-enable max-len */

module.exports = class SpacesService {
  /**
   * @param {SpaceCreateArgs} params
   * @returns {Promise<Space>}
   */
  static create(params) {
    return prisma.space.create(params);
  }

  /**
   * @param {SpaceFindManyArgs} params
   * @returns {Promise<Space[]>}
   */
  static findMany(params) {
    return prisma.space.findMany(params);
  }

  /**
   * @param {SpaceFindUniqueArgs} params
   * @returns {Promise<Space | null>}
   */
  static findUnique(params) {
    return prisma.space.findUnique(params);
  }

  /**
   * @param {SpaceUpdateArgs} params
   * @returns {Promise<Space>}
   */
  static update(params) {
    return prisma.space.update(params);
  }

  /**
   * @param {SpaceUpsertArgs} params
   * @returns {Promise<Space>}
   */
  static upsert(params) {
    return prisma.space.upsert(params);
  }

  /**
   * @param {SpaceDeleteArgs} params
   * @returns {Promise<Space | null>}
   */
  static delete(params) {
    return prisma.space.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};
