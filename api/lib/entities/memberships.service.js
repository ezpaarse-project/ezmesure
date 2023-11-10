// @ts-check
const { client: prisma } = require('../services/prisma.service');
const hooks = require('../hooks/hookEmitter');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs
 */
/* eslint-enable max-len */

module.exports = class MembershipsService {
  /**
   * @param {MembershipCreateArgs} params
   * @returns {Promise<Membership>}
   */
  static async create(params) {
    const membership = await prisma.membership.create(params);

    hooks.emit('membership:upsert', membership);

    return membership;
  }

  /**
   * @param {MembershipFindManyArgs} params
   * @returns {Promise<Membership[]>}
   */
  static findMany(params) {
    return prisma.membership.findMany(params);
  }

  /**
   * @param {MembershipFindUniqueArgs} params
   * @returns {Promise<Membership | null>}
   */
  static findUnique(params) {
    return prisma.membership.findUnique(params);
  }

  /**
   * @param {MembershipUpdateArgs} params
   * @returns {Promise<Membership>}
   */
  static async update(params) {
    const membership = await prisma.membership.update(params);

    hooks.emit('membership:upsert', membership);

    return membership;
  }

  /**
   * @param {MembershipUpsertArgs} params
   * @returns {Promise<Membership>}
   */
  static async upsert(params) {
    const membership = await prisma.membership.upsert(params);

    hooks.emit('membership:upsert', membership);

    return membership;
  }

  /**
   * @param {MembershipDeleteArgs} params
   * @returns {Promise<Membership>}
   */
  static async delete(params) {
    const membership = await prisma.membership.delete(params);

    hooks.emit('membership:delete', membership);

    return membership;
  }
};
