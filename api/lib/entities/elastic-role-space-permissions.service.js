// @ts-check

const BasePrismaService = require('./base-prisma.service');
const elasticRoleSpacePermissionsPrisma = require('../services/prisma/elastic-role-space-permissions');

/* eslint-disable max-len */
/** @typedef {import('../.prisma/client').ElasticRoleSpacePermission} ElasticRoleSpacePermission */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionUpdateArgs} ElasticRoleSpacePermissionUpdateArgs */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionUpsertArgs} ElasticRoleSpacePermissionUpsertArgs */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionFindUniqueArgs} ElasticRoleSpacePermissionFindUniqueArgs */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionFindManyArgs} ElasticRoleSpacePermissionFindManyArgs */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionCreateArgs} ElasticRoleSpacePermissionCreateArgs */
/** @typedef {import('../.prisma/client').Prisma.ElasticRoleSpacePermissionDeleteArgs} ElasticRoleSpacePermissionDeleteArgs */
/* eslint-enable max-len */

module.exports = class ElasticRoleSpacePermissionService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ElasticRoleSpacePermissionService>} */
  static $transaction = super.$transaction;

  /**
   * @param {ElasticRoleSpacePermissionCreateArgs} params
   * @returns {Promise<ElasticRoleSpacePermission>}
   */
  async create(params) {
    const permission = await elasticRoleSpacePermissionsPrisma.create(params, this.prisma);
    this.triggerHooks('elastic_role_space_permission:create', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleSpacePermissionFindManyArgs} params
   * @returns {Promise<ElasticRoleSpacePermission[]>}
   */
  findMany(params) {
    return elasticRoleSpacePermissionsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ElasticRoleSpacePermissionFindUniqueArgs} params
   * @returns {Promise<ElasticRoleSpacePermission | null>}
   */
  findUnique(params) {
    return elasticRoleSpacePermissionsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ElasticRoleSpacePermissionUpdateArgs} params
   * @returns {Promise<ElasticRoleSpacePermission>}
   */
  async update(params) {
    const permission = await elasticRoleSpacePermissionsPrisma.update(params, this.prisma);
    this.triggerHooks('elastic_role_space_permission:update', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleSpacePermissionUpsertArgs} params
   * @returns {Promise<ElasticRoleSpacePermission>}
   */
  async upsert(params) {
    const permission = await elasticRoleSpacePermissionsPrisma.upsert(params, this.prisma);
    this.triggerHooks('elastic_role_space_permission:upsert', permission);
    return permission;
  }

  /**
   * @param {ElasticRoleSpacePermissionDeleteArgs} params
   * @returns {Promise<ElasticRoleSpacePermission | null>}
   */
  async delete(params) {
    const permission = await elasticRoleSpacePermissionsPrisma.remove(params, this.prisma);
    this.triggerHooks('elastic_role_space_permission:delete', permission);
    return permission;
  }
};
