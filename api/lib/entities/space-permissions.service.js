// @ts-check

const BasePrismaService = require('./base-prisma.service');
const spacePermissionsPrisma = require('../services/prisma/space-permissions');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').SpacePermission} SpacePermission */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpdateArgs} SpacePermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionUpsertArgs} SpacePermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindUniqueArgs} SpacePermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionFindManyArgs} SpacePermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionCreateArgs} SpacePermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteArgs} SpacePermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class SpacePermissionsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SpacePermissionsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SpacePermissionCreateArgs} params
   * @returns {Promise<SpacePermission>}
   */
  async create(params) {
    const spacePermission = await spacePermissionsPrisma.create(params, this.prisma);
    this.triggerHooks('space_permission:create', spacePermission);
    return spacePermission;
  }

  /**
   * @param {SpacePermissionFindManyArgs} params
   * @returns {Promise<SpacePermission[]>}
   */
  findMany(params) {
    return spacePermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SpacePermissionFindUniqueArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  findUnique(params) {
    return spacePermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {SpacePermissionUpdateArgs} params
   * @returns {Promise<SpacePermission>}
   */
  async update(params) {
    const spacePermission = await spacePermissionsPrisma.update(params, this.prisma);
    this.triggerHooks('space_permission:update', spacePermission);
    return spacePermission;
  }

  /**
   * @param {SpacePermissionUpsertArgs} params
   * @returns {Promise<SpacePermission>}
   */
  async upsert(params) {
    const spacePermission = await spacePermissionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('space_permission:upsert', spacePermission);
    return spacePermission;
  }

  /**
   * @param {SpacePermissionDeleteArgs} params
   * @returns {Promise<SpacePermission | null>}
   */
  async delete(params) {
    const spacePermission = await spacePermissionsPrisma.remove(params, this.prisma);
    this.triggerHooks('space_permission:delete', spacePermission);
    return spacePermission;
  }
};
