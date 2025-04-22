// @ts-check
const BasePrismaService = require('./base-prisma.service');
const repositoryAliasesPrisma = require('../services/prisma/repository-aliases');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasUpdateArgs} RepositoryAliasUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasUpsertArgs} RepositoryAliasUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasCountArgs} RepositoryAliasCountArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasFindUniqueArgs} RepositoryAliasFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasFindFirstArgs} RepositoryAliasFindFirstArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasFindManyArgs} RepositoryAliasFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasCreateArgs} RepositoryAliasCreateArgs */
/** @typedef {import('@prisma/client').Prisma.RepositoryAliasDeleteArgs} RepositoryAliasDeleteArgs */
/* eslint-enable max-len */

module.exports = class RepositoriesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RepositoriesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RepositoryAliasCreateArgs} params
   * @returns {Promise<RepositoryAlias>}
   */
  async create(params) {
    const repositoryAlias = await repositoryAliasesPrisma.create(params, this.prisma);
    this.triggerHooks('repository_alias:create', repositoryAlias);
    return repositoryAlias;
  }

  /**
   * @param {RepositoryAliasFindManyArgs} params
   * @returns {Promise<RepositoryAlias[]>}
   */
  findMany(params) {
    return repositoryAliasesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasFindUniqueArgs} params
   * @returns {Promise<RepositoryAlias | null>}
   */
  findUnique(params) {
    return repositoryAliasesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasFindFirstArgs} params
   * @returns {Promise<RepositoryAlias | null>}
   */
  findFirst(params) {
    return repositoryAliasesPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {string} pattern
   * @returns {Promise<RepositoryAlias | null>}
   */
  findByPattern(pattern) {
    return repositoryAliasesPrisma.findUnique({ where: { pattern } }, this.prisma);
  }

  /**
   * @param {RepositoryAliasUpdateArgs} params
   * @returns {Promise<RepositoryAlias>}
   */
  async update(params) {
    const repositoryAlias = await repositoryAliasesPrisma.update(params, this.prisma);
    this.triggerHooks('repository_alias:update', repositoryAlias);
    return repositoryAlias;
  }

  /**
   *
   * @param {string} pattern
   * @param {string} institutionId
   */
  async connectInstitution(pattern, institutionId) {
    const repositoryAlias = await repositoryAliasesPrisma.connectInstitution(
      pattern,
      institutionId,
    );
    this.triggerHooks('repository_alias:update', repositoryAlias);
    return repositoryAlias;
  }

  /**
   * @param {RepositoryAliasUpsertArgs} params
   * @returns {Promise<RepositoryAlias>}
   */
  async upsert(params) {
    const repositoryAlias = await repositoryAliasesPrisma.upsert(params, this.prisma);
    this.triggerHooks('repository_alias:upsert', repositoryAlias);
    return repositoryAlias;
  }

  /**
   * @param {RepositoryAliasCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return repositoryAliasesPrisma.count(params, this.prisma);
  }

  /**
   * @param {RepositoryAliasDeleteArgs} params
   * @returns {Promise<RepositoryAlias | null>}
   */
  async delete(params) {
    const result = await repositoryAliasesPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }
    const { deleteResult, deletedRepositoryAlias } = result;

    this.triggerHooks('repository_alias:delete', deletedRepositoryAlias);
    deletedRepositoryAlias.permissions.forEach((repoPerm) => { this.triggerHooks('repository_alias_permission:delete', repoPerm); });
    deletedRepositoryAlias.elasticRolePermissions.forEach((rolePerm) => { this.triggerHooks('elastic_role_repository_alias_permission:delete', rolePerm); });

    return deleteResult;
  }

  /**
   * Disconnect a repositoryAlias from an institution and remove all associated permissions
   * @param {string} pattern
   * @param {string} institutionId
   * @returns {Promise<RepositoryAlias | null>}
   */
  async disconnectInstitution(pattern, institutionId) {
    const result = await repositoryAliasesPrisma.disconnectInstitution(pattern, institutionId);
    if (!result) {
      return null;
    }
    const { newRepositoryAlias, oldRepositoryAlias } = result;

    this.triggerHooks('repository_alias:disconnected', oldRepositoryAlias, institutionId);
    oldRepositoryAlias.permissions.forEach((repoPerm) => { this.triggerHooks('repository_alias_permission:delete', repoPerm); });

    return newRepositoryAlias;
  }
};
