// @ts-check

const BasePrismaService = require('./base-prisma.service');
const elasticRoleRepositoryPermissionsPrisma = require('../services/prisma/elastic-role-repository-permissions');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').ElasticRoleRepositoryPermission} ElasticRoleRepositoryPermission */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionUpdateArgs} ElasticRoleRepositoryPermissionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionUpsertArgs} ElasticRoleRepositoryPermissionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionFindUniqueArgs} ElasticRoleRepositoryPermissionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionFindManyArgs} ElasticRoleRepositoryPermissionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionCreateArgs} ElasticRoleRepositoryPermissionCreateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleRepositoryPermissionDeleteArgs} ElasticRoleRepositoryPermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class ElasticRoleRepositoryPermissionService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ElasticRoleRepositoryPermissionService>} */
  static $transaction = super.$transaction;

  /**
   * @param {ElasticRoleRepositoryPermissionCreateArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission>}
   */
  async create(params) {
    const permission = await elasticRoleRepositoryPermissionsPrisma.create(params, this.prisma);
    this.triggerHooks('elastic_role_repository_permission:create', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryPermissionFindManyArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission[]>}
   */
  findMany(params) {
    return elasticRoleRepositoryPermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ElasticRoleRepositoryPermissionFindUniqueArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission | null>}
   */
  findUnique(params) {
    return elasticRoleRepositoryPermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ElasticRoleRepositoryPermissionUpdateArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission>}
   */
  async update(params) {
    const permission = await elasticRoleRepositoryPermissionsPrisma.update(params, this.prisma);
    this.triggerHooks('elastic_role_repository_permission:update', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryPermissionUpsertArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission>}
   */
  async upsert(params) {
    const permission = await elasticRoleRepositoryPermissionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('elastic_role_repository_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleRepositoryPermissionDeleteArgs} params
   * @returns {Promise<ElasticRoleRepositoryPermission | null>}
   */
  async delete(params) {
    const permission = await elasticRoleRepositoryPermissionsPrisma.remove(params, this.prisma);
    this.triggerHooks('elastic_role_repository_permission:delete', permission);
    return permission;
  }
};
