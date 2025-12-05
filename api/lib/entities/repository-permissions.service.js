// @ts-check

const BasePrismaService = require('./base-prisma.service');
const repositoryPermissionsPrisma = require('../services/prisma/repository-permissions');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').RepositoryPermission} RepositoryPermission */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionUpdateArgs} RepositoryPermissionUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionUpsertArgs} RepositoryPermissionUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionFindUniqueArgs} RepositoryPermissionFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionFindManyArgs} RepositoryPermissionFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionCreateArgs} RepositoryPermissionCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryPermissionDeleteArgs} RepositoryPermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoryPermissionsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoryPermissionsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RepositoryPermissionCreateArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  async create(params) {
    const permission = await repositoryPermissionsPrisma.create(params, this.prisma);
    this.triggerHooks('repository_permission:create', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionFindManyArgs} params
   * @returns {Promise<RepositoryPermission[]>}
   */
  findMany(params) {
    return repositoryPermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RepositoryPermissionFindUniqueArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  findUnique(params) {
    return repositoryPermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} institutionId
   * @param {string} pattern
   * @param {string} username
   * @returns {Promise<RepositoryPermission | null>}
   */
  findById(institutionId, pattern, username) {
    return repositoryPermissionsPrisma.findById(institutionId, pattern, username, this.prisma);
  }

  /**
   * @param {RepositoryPermissionUpdateArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  async update(params) {
    const permission = await repositoryPermissionsPrisma.update(params, this.prisma);
    this.triggerHooks('repository_permission:update', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionUpsertArgs} params
   * @returns {Promise<RepositoryPermission>}
   */
  async upsert(params) {
    const permission = await repositoryPermissionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('repository_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {RepositoryPermissionDeleteArgs} params
   * @returns {Promise<RepositoryPermission | null>}
   */
  async delete(params) {
    const permission = await repositoryPermissionsPrisma.remove(params, this.prisma);
    this.triggerHooks('repository_permission:delete', permission);
    return permission;
  }

  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** * @param {RepositoryPermissionsService} service */
    const transaction = async (service) => {
      const permissions = await service.findMany({});

      if (permissions.length === 0) { return null; }

      await Promise.all(
        permissions.map(
          (permission) => service.delete({
            where: {
              username_institutionId_repositoryPattern: {
                username: permission.username,
                institutionId: permission.institutionId,
                repositoryPattern: permission.repositoryPattern,
              },
            },
          }),
        ),
      );

      return permissions;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return RepositoryPermissionsService.$transaction(transaction);
  }
};
