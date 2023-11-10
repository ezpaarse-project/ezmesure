// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');
const hooks = require('../hooks/hookEmitter');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SpacePermission} SpacePermission */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpdateArgs} SpacePermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpsertArgs} SpacePermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindUniqueArgs} SpacePermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindManyArgs} SpacePermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionCreateArgs} SpacePermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteArgs} SpacePermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class SpacePermissionsService {
  /**
   * @param {SpacePermissionCreateArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static async create(params) {
    const spacePermission = await prisma.spacePermission.create(params);

    hooks.emit('space_permission:create', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionFindManyArgs} params
   * @returns {Promise<SpacePermission[]>}
   */
  static findMany(params) {
    return prisma.spacePermission.findMany(params);
  }

  /**
   * @param {SpacePermissionFindUniqueArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  static findUnique(params) {
    return prisma.spacePermission.findUnique(params);
  }

  /**
   * @param {SpacePermissionUpdateArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static async update(params) {
    const spacePermission = await prisma.spacePermission.update(params);

    hooks.emit('space_permission:update', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionUpsertArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static async upsert(params) {
    const spacePermission = await prisma.spacePermission.upsert(params);

    hooks.emit('space_permission:upsert', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionDeleteArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  static async delete(params) {
    let spacePermission;

    try {
      spacePermission = await prisma.spacePermission.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }

    hooks.emit('space_permission:delete', spacePermission);

    return spacePermission;
  }
};
