// @ts-check

const spacePermissionsPrisma = require('../services/prisma/space-permissions');
const { triggerHooks } = require('../hooks/hookEmitter');

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
    const spacePermission = await spacePermissionsPrisma.create(params);

    triggerHooks('space_permission:create', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionFindManyArgs} params
   * @returns {Promise<SpacePermission[]>}
   */
  static findMany(params) {
    return spacePermissionsPrisma.findMany(params);
  }

  /**
   * @param {SpacePermissionFindUniqueArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  static findUnique(params) {
    return spacePermissionsPrisma.findUnique(params);
  }

  /**
   * @param {SpacePermissionUpdateArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static async update(params) {
    const spacePermission = await spacePermissionsPrisma.update(params);

    triggerHooks('space_permission:update', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionUpsertArgs} params
   * @returns {Promise<SpacePermission>}
   */
  static async upsert(params) {
    const spacePermission = await spacePermissionsPrisma.upsert(params);

    triggerHooks('space_permission:upsert', spacePermission);

    return spacePermission;
  }

  /**
   * @param {SpacePermissionDeleteArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  static async delete(params) {
    const spacePermission = await spacePermissionsPrisma.remove(params);

    triggerHooks('space_permission:delete', spacePermission);

    return spacePermission;
  }
};
