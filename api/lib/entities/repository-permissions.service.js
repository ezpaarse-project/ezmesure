// @ts-check

const repositoryPermissionsPrisma = require('../services/prisma/repository-permissions');
const { triggerHooks } = require('../hooks/hookEmitter');

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
    const permission = await repositoryPermissionsPrisma.create(params);
    triggerHooks('repository_permission:create', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionFindManyArgs} params
   * @returns {Promise<RepositoryPermission[]>}
   */
  static findMany(params) {
    return repositoryPermissionsPrisma.findMany(params);
  }

  /**
   * @param {RepositoryPermissionFindUniqueArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  static findUnique(params) {
    return repositoryPermissionsPrisma.findUnique(params);
  }

  /**
   * @param {string} institutionId
   * @param {string} pattern
   * @param {string} username
   * @returns {Promise<RepositoryPermission | null>}
   */
  static findById(institutionId, pattern, username) {
    return repositoryPermissionsPrisma.findById(institutionId, pattern, username);
  }

  /**
   * @param {RepositoryPermissionUpdateArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static async update(params) {
    const permission = await repositoryPermissionsPrisma.update(params);
    triggerHooks('repository_permission:update', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionUpsertArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static async upsert(params) {
    const permission = await repositoryPermissionsPrisma.upsert(params);
    triggerHooks('repository_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionDeleteArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  static async delete(params) {
    const permission = await repositoryPermissionsPrisma.remove(params);
    triggerHooks('repository_permission:delete', permission);
    return permission;
  }

  static async removeAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const permissions = await this.findMany({});

    await Promise.all(permissions.map(async (permission) => {
      await this.delete({
        where: {
          username_institutionId_repositoryPattern: {
            username: permission.username,
            institutionId: permission.institutionId,
            repositoryPattern: permission.repositoryPattern,
          },
        },
      });
    }));

    return permissions;
  }
};
