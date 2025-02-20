// @ts-check

const BasePrismaService = require('./base-prisma.service');
const elasticRolesPrisma = require('../services/prisma/elastic-roles');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').ElasticRole} ElasticRole */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleUpdateArgs} ElasticRoleUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleUpsertArgs} ElasticRoleUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleCountArgs} ElasticRoleCountArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleFindUniqueArgs} ElasticRoleFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleFindManyArgs} ElasticRoleFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleCreateArgs} ElasticRoleCreateArgs */
/** @typedef {import('@prisma/client').Prisma.ElasticRoleDeleteArgs} ElasticRoleDeleteArgs */
/* eslint-enable max-len */

module.exports = class ElasticRoleService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<ElasticRoleService>} */
  static $transaction = super.$transaction;

  /**
   * @param {ElasticRoleCreateArgs} params
   * @returns {Promise<ElasticRole>}
   */
  async create(params) {
    const elasticRole = await elasticRolesPrisma.create(params, this.prisma);
    this.triggerHooks('elastic_role:create', elasticRole);
    return elasticRole;
  }

  /**
   * @param {ElasticRoleFindManyArgs} params
   * @returns {Promise<ElasticRole[]>}
   */
  findMany(params) {
    return elasticRolesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {ElasticRoleFindUniqueArgs} params
   * @returns {Promise<ElasticRole | null>}
   */
  findUnique(params) {
    return elasticRolesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {ElasticRoleUpdateArgs} params
   * @returns {Promise<ElasticRole>}
   */
  async update(params) {
    const elasticRole = await elasticRolesPrisma.update(params, this.prisma);
    this.triggerHooks('elastic_role:update', elasticRole);
    return elasticRole;
  }

  /**
   * @param {ElasticRoleUpsertArgs} params
   * @returns {Promise<ElasticRole>}
   */
  async upsert(params) {
    const elasticRole = await elasticRolesPrisma.upsert(params, this.prisma);
    this.triggerHooks('elastic_role:upsert', elasticRole);
    return elasticRole;
  }

  /**
   * @param {ElasticRoleCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return elasticRolesPrisma.count(params, this.prisma);
  }

  /**
   * @param {ElasticRoleDeleteArgs} params
   * @returns {Promise<ElasticRole | null>}
   */
  async delete(params) {
    const res = await elasticRolesPrisma.remove(params, this.prisma);
    if (!res) {
      return null;
    }

    const { deletedElasticRole } = res;
    this.triggerHooks('elastic_role:delete', deletedElasticRole);
    deletedElasticRole.users.forEach((user) => { this.triggerHooks('user:disconnect:elastic_role', { user, role: deletedElasticRole }); });
    deletedElasticRole.institutions.forEach((institution) => { this.triggerHooks('institution:disconnect:elastic_role', { institution, role: deletedElasticRole }); });

    return deletedElasticRole;
  }
};
