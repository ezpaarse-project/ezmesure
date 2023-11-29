// @ts-check
const { client: prisma } = require('../services/prisma.service');
const { triggerHooks } = require('../hooks/hookEmitter');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').Space} Space */
/** @typedef {import('@prisma/client').Prisma.SpaceUpdateArgs} SpaceUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceUpsertArgs} SpaceUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindUniqueArgs} SpaceFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceFindManyArgs} SpaceFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceCreateArgs} SpaceCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpaceDeleteArgs} SpaceDeleteArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs */
/* eslint-enable max-len */

module.exports = class SpacesService {
  /**
   * @param {SpaceCreateArgs} params
   * @returns {Promise<Space>}
   */
  static async create(params) {
    const space = await prisma.space.create(params);

    triggerHooks('space:create', space);

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
   * @param {string} id
   * @returns {Promise<Space | null>}
   */
  static findByID(id) {
    return prisma.space.findUnique({ where: { id } });
  }

  /**
   * @param {SpaceUpdateArgs} params
   * @returns {Promise<Space>}
   */
  static async update(params) {
    const space = await prisma.space.update(params);

    triggerHooks('space:update', space);

    return space;
  }

  /**
   * @param {SpaceUpsertArgs} params
   * @returns {Promise<Space>}
   */
  static async upsert(params) {
    const space = await prisma.space.upsert(params);

    triggerHooks('space:upsert', space);

    return space;
  }

  /**
   * @param {SpaceDeleteArgs} params
   * @returns {Promise<Space | null>}
   */
  static async delete(params) {
    const [deleteResult, deletedSpace] = await prisma.$transaction(async (tx) => {
      const space = await tx.space.findUnique({
        where: params.where,
        include: {
          permissions: true,
        },
      });

      if (!space) {
        return [null, null];
      }

      await tx.spacePermission.deleteMany({
        where: { spaceId: space.id },
      });

      return [
        await tx.space.delete(params),
        space,
      ];
    });

    if (!deletedSpace) {
      return null;
    }

    triggerHooks('space:delete', deletedSpace);
    deletedSpace.permissions.forEach((spacePerm) => { triggerHooks('space_permission:delete', spacePerm); });

    return deleteResult;
  }

  /**
   * @returns {Promise<Array<Space> | null>}
   */
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const spaces = await this.findMany({});

    await Promise.all(spaces.map(async (space) => {
      await this.delete({
        where: {
          id: space.id,
        },
      });
    }));

    return spaces;
  }
};
