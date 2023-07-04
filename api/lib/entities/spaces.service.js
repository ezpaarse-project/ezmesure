// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');
const hooks = require('../hooks');

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
  static async create(params) {
    const space = await prisma.space.create(params);

    hooks.emit('space:create', space);

    return space;
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
  static async update(params) {
    const space = await prisma.space.update(params);

    hooks.emit('space:update', space);

    return space;
  }

  /**
   * @param {SpaceUpsertArgs} params
   * @returns {Promise<Space>}
   */
  static async upsert(params) {
    const space = await prisma.space.upsert(params);

    hooks.emit('space:upsert', space);

    return space;
  }

  /**
   * @param {SpaceDeleteArgs} params
   * @returns {Promise<Space | null>}
   */
  static async delete(params) {
    let space;

    try {
      space = await prisma.space.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }

    hooks.emit('space:delete', space);

    return space;
  }
};
