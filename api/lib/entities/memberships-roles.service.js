// @ts-check

const BasePrismaService = require('./base-prisma.service');
const membershipRolesPrisma = require('../services/prisma/membership-roles');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').MembershipRole} MembershipRole */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleUpdateArgs} MembershipRoleUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleUpsertArgs} MembershipRoleUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleCountArgs} MembershipRoleCountArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleFindUniqueArgs} MembershipRoleFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleFindManyArgs} MembershipRoleFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleCreateArgs} MembershipRoleCreateArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipRoleDeleteArgs} MembershipRoleDeleteArgs */
/* eslint-enable max-len */

module.exports = class MembershipRolesService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<MembershipRolesService>} */
  static $transaction = super.$transaction;

  /**
   * @param {MembershipRoleCreateArgs} params
   * @returns {Promise<MembershipRole>}
   */
  async create(params) {
    const role = await membershipRolesPrisma.create(params, this.prisma);
    this.triggerHooks('role:create', role);
    return role;
  }

  /**
   * @param {MembershipRoleFindManyArgs} params
   * @returns {Promise<MembershipRole[]>}
   */
  findMany(params) {
    return membershipRolesPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {MembershipRoleFindUniqueArgs} params
   * @returns {Promise<MembershipRole | null>}
   */
  findUnique(params) {
    return membershipRolesPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {MembershipRoleUpdateArgs} params
   * @returns {Promise<MembershipRole>}
   */
  async update(params) {
    const role = await membershipRolesPrisma.update(params, this.prisma);
    this.triggerHooks('role:update', role);
    return role;
  }

  /**
   * @param {MembershipRoleUpsertArgs} params
   * @returns {Promise<MembershipRole>}
   */
  async upsert(params) {
    const role = await membershipRolesPrisma.upsert(params, this.prisma);
    this.triggerHooks('role:upsert', role);
    return role;
  }

  /**
   * @param {MembershipRoleCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return membershipRolesPrisma.count(params, this.prisma);
  }

  /**
   * @param {MembershipRoleDeleteArgs} params
   * @returns {Promise<MembershipRole | null>}
   */
  async delete(params) {
    const role = await membershipRolesPrisma.remove(params, this.prisma);
    this.triggerHooks('role:delete', role);
    return role;
  }
};
