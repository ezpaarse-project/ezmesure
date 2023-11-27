// @ts-check
const hooks = require('../hooks');
const { client: prisma, Prisma } = require('../services/prisma.service');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionUpdateArgs} RepositoryPermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionUpsertArgs} RepositoryPermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionFindUniqueArgs} RepositoryPermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionFindManyArgs} RepositoryPermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateArgs} RepositoryPermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteArgs} RepositoryPermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoryPermissionsService {
  /**
   * @param {RepositoryPermissionCreateArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static async create(params) {
    const permission = await prisma.repositoryPermission.create(params);

    hooks.emit('repository_permission:create', permission);

    return permission;
  }

  /**
   * @param {RepositoryPermissionFindManyArgs} params
   * @returns {Promise<RepositoryPermission[]>}
   */
  static findMany(params) {
    return prisma.repositoryPermission.findMany(params);
  }

  /**
   * @param {RepositoryPermissionFindUniqueArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  static findUnique(params) {
    return prisma.repositoryPermission.findUnique(params);
  }

  /**
   * @param {RepositoryPermissionUpdateArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static async update(params) {
    const permission = await prisma.repositoryPermission.update(params);

    hooks.emit('repository_permission:update', permission);

    return permission;
  }

  /**
   * @param {RepositoryPermissionUpsertArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static async upsert(params) {
    const permission = await prisma.repositoryPermission.upsert(params);

    hooks.emit('repository_permission:upsert', permission);

    return permission;
  }

  /**
   * @param {RepositoryPermissionDeleteArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  static async delete(params) {
    let permission;
    try {
      permission = await prisma.repositoryPermission.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
    hooks.emit('repository_permission:delete', permission);

    return permission;
  }

  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const permissions = await this.findMany({});

    await prisma.repositoryPermission.deleteMany();

    hooks.emit('repository_permission:deleteAll', permissions);

    return permissions;
  }
};
