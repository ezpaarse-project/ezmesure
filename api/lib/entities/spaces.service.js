// @ts-check

const BasePrismaService = require('./base-prisma.service');
const spacesPrisma = require('../services/prisma/spaces');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Space} Space */
/** @typedef {import('@prisma/client').Prisma.SpaceUpdateArgs} SpaceUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceUpsertArgs} SpaceUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindUniqueArgs} SpaceFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindManyArgs} SpaceFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceCreateArgs} SpaceCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceDeleteArgs} SpaceDeleteArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceCountArgs} SpaceCountArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs */
/* eslint-enable max-len */

module.exports = class SpacesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SpacesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SpaceCreateArgs} params
   * @returns {Promise<Space>}
   */
  async create(params) {
    const space = await spacesPrisma.create(params, this.prisma);
    this.triggerHooks('space:create', space);
    return space;
  }

  /**
   * @param {SpaceFindManyArgs} params
   * @returns {Promise<Space[]>}
   */
  findMany(params) {
    return spacesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SpaceFindUniqueArgs} params
   * @returns {Promise<Space | null>}
   */
  findUnique(params) {
    return spacesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<Space | null>}
   */
  findByID(id) {
    return spacesPrisma.findUnique({ where: { id } }, this.prisma);
  }

  /**
   * @param {SpaceUpdateArgs} params
   * @returns {Promise<Space>}
   */
  async update(params) {
    const space = await spacesPrisma.update(params, this.prisma);
    this.triggerHooks('space:update', space);
    return space;
  }

  /**
   * @param {SpaceUpsertArgs} params
   * @returns {Promise<Space>}
   */
  async upsert(params) {
    const space = await spacesPrisma.upsert(params, this.prisma);
    this.triggerHooks('space:upsert', space);
    return space;
  }

  /**
   * @param {SpaceCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return spacesPrisma.count(params, this.prisma);
  }

  /**
   * @param {SpaceDeleteArgs} params
   * @returns {Promise<Space | null>}
   */
  async delete(params) {
    const result = await spacesPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    const { deleteResult, deletedSpace } = result;

    this.triggerHooks('space:delete', deletedSpace);
    deletedSpace.permissions.forEach((spacePerm) => { this.triggerHooks('space_permission:delete', spacePerm); });
    return deleteResult;
  }

  /**
   * @returns {Promise<Array<Space> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SpacesService} service */
    const transaction = async (service) => {
      const spaces = await service.findMany({});

      if (spaces.length === 0) { return null; }

      await Promise.all(
        spaces.map(
          (space) => service.delete({
            where: {
              id: space.id,
            },
          }),
        ),
      );

      return spaces;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return SpacesService.$transaction(transaction);
  }
};
