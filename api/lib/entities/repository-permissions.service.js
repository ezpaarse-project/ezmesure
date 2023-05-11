// @ts-check
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
  static create(params) {
    return prisma.repositoryPermission.create(params);
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
  static update(params) {
    return prisma.repositoryPermission.update(params);
  }

  /**
   * @param {RepositoryPermissionUpsertArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  static upsert(params) {
    return prisma.repositoryPermission.upsert(params);
  }

  /**
   * @param {RepositoryPermissionDeleteArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  static delete(params) {
    return prisma.repositoryPermission.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};
