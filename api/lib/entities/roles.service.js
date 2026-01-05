// @ts-check

const BasePrismaService = require('./base-prisma.service');
const rolesPrisma = require('../services/prisma/roles');

/* eslint-disable max-len */
/** @typedef {import('../../lib/.prisma/client.mjs').Role} Role */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleUpdateArgs} RoleUpdateArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleUpsertArgs} RoleUpsertArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleCountArgs} RoleCountArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleFindUniqueArgs} RoleFindUniqueArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleFindManyArgs} RoleFindManyArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleCreateArgs} RoleCreateArgs */
/** @typedef {import('../../lib/.prisma/client.mjs').Prisma.RoleDeleteArgs} RoleDeleteArgs */
/* eslint-enable max-len */

module.exports = class RolesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<RolesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {RoleCreateArgs} params
   * @returns {Promise<Role>}
   */
  async create(params) {
    const role = await rolesPrisma.create(params, this.prisma);
    this.triggerHooks('role:create', role);
    return role;
  }

  /**
   * @param {RoleFindManyArgs} params
   * @returns {Promise<Role[]>}
   */
  findMany(params) {
    return rolesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {RoleFindUniqueArgs} params
   * @returns {Promise<Role | null>}
   */
  findUnique(params) {
    return rolesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {RoleUpdateArgs} params
   * @returns {Promise<Role>}
   */
  async update(params) {
    const role = await rolesPrisma.update(params, this.prisma);
    this.triggerHooks('role:update', role);
    return role;
  }

  /**
   * @param {RoleUpsertArgs} params
   * @returns {Promise<Role>}
   */
  async upsert(params) {
    const role = await rolesPrisma.upsert(params, this.prisma);
    this.triggerHooks('role:upsert', role);
    return role;
  }

  /**
   * @param {RoleCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return rolesPrisma.count(params, this.prisma);
  }

  /**
   * @param {RoleDeleteArgs} params
   * @returns {Promise<Role | null>}
   */
  async delete(params) {
    const deleted = await rolesPrisma.remove(params, this.prisma);
    if (!deleted) {
      return null;
    }

    const { deleteResult, role } = deleted;
    this.triggerHooks('role:delete', role);
    return deleteResult;
  }
};
