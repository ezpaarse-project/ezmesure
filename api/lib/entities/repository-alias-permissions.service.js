// @ts-check

const BasePrismaService = require('./base-prisma.service');
const repositoryAliasPermissionsPrisma = require('../services/prisma/repository-alias-permissions');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client.mts').RepositoryAliasPermission} RepositoryAliasPermission */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionUpdateArgs} RepositoryAliasPermissionUpdateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionUpsertArgs} RepositoryAliasPermissionUpsertArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionFindUniqueArgs} RepositoryAliasPermissionFindUniqueArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionFindManyArgs} RepositoryAliasPermissionFindManyArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionCreateArgs} RepositoryAliasPermissionCreateArgs */
/** @typedef {import('../.prisma/client.mts').Prisma.RepositoryAliasPermissionDeleteArgs} RepositoryAliasPermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoryAliasPermissionsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoryAliasPermissionsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RepositoryAliasPermissionCreateArgs} params
   * @returns {Promise<RepositoryAliasPermission>}
   */
  async create(params) {
    const permission = await repositoryAliasPermissionsPrisma.create(params, this.prisma);
    this.triggerHooks('repository_alias_permission:create', permission);
    return permission;
  }

  /**
   * @param {RepositoryAliasPermissionFindManyArgs} params
   * @returns {Promise<RepositoryAliasPermission[]>}
   */
  findMany(params) {
    return repositoryAliasPermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasPermissionFindUniqueArgs} params
   * @returns {Promise<RepositoryAliasPermission | null>}
   */
  findUnique(params) {
    return repositoryAliasPermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} institutionId
   * @param {string} pattern
   * @param {string} username
   * @returns {Promise<RepositoryAliasPermission | null>}
   */
  findById(institutionId, pattern, username) {
    return repositoryAliasPermissionsPrisma.findById(institutionId, pattern, username, this.prisma);
  }

  /**
   * @param {RepositoryAliasPermissionUpdateArgs} params
   * @returns {Promise<RepositoryAliasPermission>}
   */
  async update(params) {
    const permission = await repositoryAliasPermissionsPrisma.update(params, this.prisma);
    this.triggerHooks('repository_alias_permission:update', permission);
    return permission;
  }

  /**
   * @param {RepositoryAliasPermissionUpsertArgs} params
   * @returns {Promise<RepositoryAliasPermission>}
   */
  async upsert(params) {
    const permission = await repositoryAliasPermissionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('repository_alias_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {RepositoryAliasPermissionDeleteArgs} params
   * @returns {Promise<RepositoryAliasPermission | null>}
   */
  async delete(params) {
    const permission = await repositoryAliasPermissionsPrisma.remove(params, this.prisma);
    this.triggerHooks('repository_alias_permission:delete', permission);
    return permission;
  }

  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** * @param {RepositoryAliasPermissionsService} service */
    const transaction = async (service) => {
      const permissions = await service.findMany({});

      if (permissions.length === 0) { return null; }

      await Promise.all(
        permissions.map(
          (permission) => service.delete({
            where: {
              username_institutionId_aliasPattern: {
                username: permission.username,
                institutionId: permission.institutionId,
                aliasPattern: permission.aliasPattern,
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
    return RepositoryAliasPermissionsService.$transaction(transaction);
  }
};
