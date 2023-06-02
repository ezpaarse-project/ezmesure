// @ts-check
const { client: prisma, Prisma } = require('../services/prisma.service');

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
  static create(params) {
    return prisma.spacePermission.create(params);
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
  static update(params) {
    return prisma.spacePermission.update(params);
  }

  /**
   * @param {SpacePermissionUpsertArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static upsert(params) {
    return prisma.spacePermission.upsert(params);
  }

  /**
   * @param {SpacePermissionDeleteArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  static delete(params) {
    return prisma.spacePermission.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};
