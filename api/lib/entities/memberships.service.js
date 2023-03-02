// @ts-check
const prisma = require('../services/prisma.service');

/** @typedef {import('@prisma/client').Membership} Membership */
/** @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs */
/** @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs */

module.exports = class MembershipsService {
  /**
   * @param {MembershipCreateArgs} params
   * @returns {Promise<Membership>}
   */
  static create(params) {
    return prisma.membership.create(params);
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
  static update(params) {
    return prisma.membership.update(params);
  }

  /**
   * @param {MembershipUpsertArgs} params
   * @returns {Promise<Membership>}
   */
  static upsert(params) {
    return prisma.membership.upsert(params);
  }

  /**
   * @param {MembershipDeleteArgs} params
   * @returns {Promise<Membership>}
   */
  static delete(params) {
    return prisma.membership.delete(params);
  }
};
