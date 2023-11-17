// @ts-check
const { client: prisma } = require('../services/prisma.service');
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
    const membership = await prisma.membership.create(params);

    triggerHooks('membership:upsert', membership);

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

    triggerHooks('membership:upsert', membership);

    return membership;
  }

  /**
   * @param {MembershipUpsertArgs} params
   * @returns {Promise<Membership>}
   */
  static async upsert(params) {
    const membership = await prisma.membership.upsert(params);

    triggerHooks('membership:upsert', membership);

    return membership;
  }

  /**
   * @param {MembershipDeleteArgs} params
   * @returns {Promise<Membership | null>}
   */
  static async delete(params) {
    const [deleteResult, deletedMembership] = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: params.where,
        include: {
          repositoryPermissions: true,
          spacePermissions: true,
        },
      });

      if (!membership) {
        return [null, null];
      }

      /** @type {RepositoryPermissionDeleteManyArgs | SpacePermissionDeleteManyArgs} */
      const findArgs = {
        where: {
          username: membership.username,
          institutionId: membership.institutionId,
        },
      };

      await tx.repositoryPermission.deleteMany(findArgs);
      await tx.spacePermission.deleteMany(findArgs);

      return [
        await tx.membership.delete(params),
        membership,
      ];
    });

    if (!deletedMembership) {
      return null;
    }

    triggerHooks('membership:delete', deletedMembership);
    deletedMembership.repositoryPermissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });
    deletedMembership.spacePermissions.forEach((spacePerm) => { triggerHooks('space_permission:delete', spacePerm); });

    return deleteResult;
  }
};
