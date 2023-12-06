// @ts-check
const membershipsPrisma = require('../services/prisma/memberships');
const { triggerHooks } = require('../hooks/hookEmitter');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteManyArgs} RepositoryPermissionDeleteManyArgs
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 */
/* eslint-enable max-len */

module.exports = class MembershipsService {
  /**
   * @param {MembershipCreateArgs} params
   * @returns {Promise<Membership>}
   */
  static async create(params) {
    const membership = await membershipsPrisma.create(params);
    triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipFindManyArgs} params
   * @returns {Promise<Membership[]>}
   */
  static findMany(params) {
    return membershipsPrisma.findMany(params);
  }

  /**
   * @param {MembershipFindUniqueArgs} params
   * @returns {Promise<Membership | null>}
   */
  static findUnique(params) {
    return membershipsPrisma.findUnique(params);
  }

  /**
   * @param {string} institutionId
   * @param {string} username
   * @param {Object | null} includes
   * @returns {Promise<Membership | null>}
   */
  static findByID(institutionId, username, includes = null) {
    return membershipsPrisma.findByID(institutionId, username, includes);
  }

  /**
   * @param {MembershipUpdateArgs} params
   * @returns {Promise<Membership>}
   */
  static async update(params) {
    const membership = await membershipsPrisma.update(params);
    triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipUpsertArgs} params
   * @returns {Promise<Membership>}
   */
  static async upsert(params) {
    const membership = await membershipsPrisma.upsert(params);
    triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipDeleteArgs} params
   * @returns {Promise<Membership | null>}
   */
  static async delete(params) {
    const { deleteResult, deletedMembership } = await membershipsPrisma.remove(params);

    if (!deletedMembership) {
      return null;
    }

    triggerHooks('membership:delete', deletedMembership);
    deletedMembership.repositoryPermissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });
    deletedMembership.spacePermissions.forEach((spacePerm) => { triggerHooks('space_permission:delete', spacePerm); });

    return deleteResult;
  }

  /**
   * @returns {Promise<Array<Membership> | null>}
   */
  static async removeAll() {
    if (process.env.NODE_ENV === 'production') { return null; }

    const memberships = await this.findMany({});

    if (memberships.length === 0) { return null; }

    await Promise.all(memberships.map(async (membership) => {
      await this.delete({
        where: {
          username_institutionId: {
            username: membership.username,
            institutionId: membership.institutionId,
          },
        },
      });
    }));

    return memberships;
  }
};
