// @ts-check
const BasePrismaService = require('./base-prisma.service');
const membershipsPrisma = require('../services/prisma/memberships');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Membership} Membership
 * @typedef {import('@prisma/client').Prisma.MembershipFindUniqueArgs} MembershipFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpdateArgs} MembershipUpdateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCreateArgs} MembershipCreateArgs
 * @typedef {import('@prisma/client').Prisma.MembershipDeleteArgs} MembershipDeleteArgs
 * @typedef {import('@prisma/client').Prisma.MembershipUpsertArgs} MembershipUpsertArgs
 * @typedef {import('@prisma/client').Prisma.MembershipCountArgs} MembershipCountArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionDeleteManyArgs} RepositoryPermissionDeleteManyArgs
 * @typedef {import('@prisma/client').Prisma.SpacePermissionDeleteManyArgs} SpacePermissionDeleteManyArgs
 */
/* eslint-enable max-len */

module.exports = class MembershipsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<MembershipsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {MembershipCreateArgs} params
   * @returns {Promise<Membership>}
   */
  async create(params) {
    const membership = await membershipsPrisma.create(params, this.prisma);
    this.triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipFindManyArgs} params
   * @returns {Promise<Membership[]>}
   */
  findMany(params) {
    return membershipsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {MembershipFindUniqueArgs} params
   * @returns {Promise<Membership | null>}
   */
  findUnique(params) {
    return membershipsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} institutionId
   * @param {string} username
   * @param {Object | null} includes
   * @returns {Promise<Membership | null>}
   */
  findByID(institutionId, username, includes = null) {
    return membershipsPrisma.findByID(institutionId, username, includes, this.prisma);
  }

  /**
   * @param {MembershipUpdateArgs} params
   * @returns {Promise<Membership>}
   */
  async update(params) {
    const membership = await membershipsPrisma.update(params, this.prisma);
    this.triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipUpsertArgs} params
   * @returns {Promise<Membership>}
   */
  async upsert(params) {
    const membership = await membershipsPrisma.upsert(params, this.prisma);
    this.triggerHooks('membership:upsert', membership);
    return membership;
  }

  /**
   * @param {MembershipCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return membershipsPrisma.count(params, this.prisma);
  }

  /**
   * @param {MembershipDeleteArgs} params
   * @returns {Promise<Membership | null>}
   */
  async delete(params) {
    const result = await membershipsPrisma.remove(params, this.prisma);

    if (!result) {
      return null;
    }

    const { deleteResult, membership } = result;

    this.triggerHooks('membership:delete', membership);
    membership.repositoryPermissions.forEach((repoPerm) => { this.triggerHooks('repository_permission:delete', repoPerm); });
    membership.spacePermissions.forEach((spacePerm) => { this.triggerHooks('space_permission:delete', spacePerm); });

    return deleteResult;
  }

  /**
   * @returns {Promise<Array<Membership> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {MembershipsService} service */
    const transaction = async (service) => {
      const memberships = await service.findMany({});

      if (memberships.length === 0) { return null; }

      await Promise.all(
        memberships.map(
          (membership) => service.delete({
            where: {
              username_institutionId: {
                username: membership.username,
                institutionId: membership.institutionId,
              },
            },
          }),
        ),
      );

      return memberships;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return MembershipsService.$transaction(transaction);
  }
};
