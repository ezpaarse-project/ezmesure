// @ts-check

const BasePrismaService = require('./base-prisma.service');
const elasticRoleRepositoryAliasPermissionsPrisma = require('../services/prisma/elastic-role-repository-alias-permissions');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').ElasticRoleRepositoryAliasPermission} ElasticRoleRepositoryAliasPermission */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionUpdateArgs} ElasticRoleRepositoryAliasPermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionUpsertArgs} ElasticRoleRepositoryAliasPermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionFindUniqueArgs} ElasticRoleRepositoryAliasPermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionFindManyArgs} ElasticRoleRepositoryAliasPermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionCreateArgs} ElasticRoleRepositoryAliasPermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryAliasPermissionDeleteArgs} ElasticRoleRepositoryAliasPermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class ElasticRoleRepositoryAliasPermissionService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ElasticRoleRepositoryAliasPermissionService>} */
  static $transaction = super.$transaction;

  /**
   * @param {ElasticRoleRepositoryAliasPermissionCreateArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
   */
  async create(params) {
    const permission = await elasticRoleRepositoryAliasPermissionsPrisma.create(
      params,
      this.prisma,
    );
    this.triggerHooks('elastic_role_repository_alias_permission:create', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryAliasPermissionFindManyArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission[]>}
   */
  findMany(params) {
    return elasticRoleRepositoryAliasPermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ElasticRoleRepositoryAliasPermissionFindUniqueArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission | null>}
   */
  findUnique(params) {
    return elasticRoleRepositoryAliasPermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ElasticRoleRepositoryAliasPermissionUpdateArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
   */
  async update(params) {
    const permission = await elasticRoleRepositoryAliasPermissionsPrisma.update(
      params,
      this.prisma,
    );
    this.triggerHooks('elastic_role_repository_alias_permission:update', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryAliasPermissionUpsertArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission>}
   */
  async upsert(params) {
    const permission = await elasticRoleRepositoryAliasPermissionsPrisma.upsert(
      params,
      this.prisma,
    );
    this.triggerHooks('elastic_role_repository_alias_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryAliasPermissionDeleteArgs} params
   * @returns {Promise<ElasticRoleRepositoryAliasPermission | null>}
   */
  async delete(params) {
    const permission = await elasticRoleRepositoryAliasPermissionsPrisma.remove(
      params,
      this.prisma,
    );
    this.triggerHooks('elastic_role_repository_alias_permission:delete', permission);
    return permission;
  }
};
