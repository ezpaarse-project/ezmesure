// @ts-check
const config = require('config');
const elasticUsers = require('../services/elastic/users');
const { client: prisma } = require('../services/prisma.service');
const { triggerHooks } = require('../hooks/hookEmitter');

const {
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('./memberships.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Prisma.UserUpsertArgs} UserUpsertArgs
 * @typedef {import('@prisma/client').Prisma.UserFindUniqueArgs} UserFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.UserFindUniqueOrThrowArgs} UserFindUniqueOrThrowArgs
 * @typedef {import('@prisma/client').Prisma.UserFindManyArgs} UserFindManyArgs
 * @typedef {import('@prisma/client').Prisma.UserUpdateArgs} UserUpdateArgs
 * @typedef {import('@prisma/client').Prisma.UserCreateArgs} UserCreateArgs
 * @typedef {import('@prisma/client').Prisma.UserDeleteArgs} UserDeleteArgs
 */
/* eslint-enable max-len */

module.exports = class UsersService {
  /**
   * @returns {Promise<User>}
   */
  static async createAdmin() {
    const username = config.get('admin.username');
    const email = config.get('admin.email');
    const fullName = 'ezMESURE Administrator';

    const adminData = {
      username,
      email,
      fullName,
      isAdmin: true,
      metadata: { acceptedTerms: true },
    };
    const admin = await prisma.user.upsert({
      where: { username },
      update: adminData,
      create: adminData,
    });

    triggerHooks('user:create-admin', admin);

    return admin;
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<User>}
   */
  static async create(params) {
    const user = await prisma.user.create(params);
    triggerHooks('user:create', user);
    return user;
  }

  /**
   * @param {UserFindManyArgs} params
   * @returns {Promise<User[]>}
   */
  static findMany(params) {
    return prisma.user.findMany(params);
  }

  /**
   * @param {UserFindUniqueArgs} params
   * @returns {Promise<User | null>}
   */
  static findUnique(params) {
    return prisma.user.findUnique(params);
  }

  /**
   * @param {UserFindUniqueOrThrowArgs} params
   * @returns {Promise<User>}
   */
  static findUniqueOrThrow(params) {
    return prisma.user.findUniqueOrThrow(params);
  }

  /**
   * @param {string} domain
   * @returns {Promise<{email: string}[]> | null}
   */
  static findEmailOfCorrespondentsWithDomain(domain) {
    return prisma.user.findMany({
      select: { email: true },
      where: {
        email: { endsWith: `@${domain}` },
        memberships: {
          some: {
            roles: {
              hasSome: [DOC_CONTACT, TECH_CONTACT],
            },
          },
        },
      },
    });
  }

  /**
   * @param {UserUpdateArgs} params
   * @returns {Promise<User>}
   */
  static async update(params) {
    // TODO manage role
    const user = await prisma.user.update(params);
    triggerHooks('user:update', user);
    return user;
  }

  /**
   * Accept terms for user.
   * @param {string} username - Username.
   *
   * @returns {Promise<User>}
   */
  static async acceptTerms(username) {
    return prisma.user.update({
      where: { username },
      data: {
        metadata: { acceptedTerms: true },
      },
    });
  }

  /**
   * @param {UserUpsertArgs} params
   * @returns {Promise<User>}
   */
  static async upsert(params) {
    const user = await prisma.user.upsert(params);
    triggerHooks('user:upsert', user);
    return user;
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  static async delete(params) {
    const [deleteResult, deletedUser] = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: params.where,
        include: {
          memberships: {
            include: {
              repositoryPermissions: true,
              spacePermissions: true,
            },
          },
        },
      });

      if (!user) {
        return [null, null];
      }

      const findArgs = { where: { username: user.username } };

      await tx.repositoryPermission.deleteMany(findArgs);
      await tx.spacePermission.deleteMany(findArgs);
      await tx.membership.deleteMany(findArgs);

      return [
        await tx.user.delete(params),
        user,
      ];
    });

    if (!deletedUser) {
      return null;
    }

    triggerHooks('user:delete', deletedUser);

    deletedUser?.memberships?.forEach((element) => {
      triggerHooks('memberships:delete', element);

      element.repositoryPermissions.forEach((repoPerm) => { triggerHooks('repository_permission:delete', repoPerm); });
      element.spacePermissions.forEach((spacePerm) => { triggerHooks('space_permission:delete', spacePerm); });
    });

    return deleteResult;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  static async updatePassword(username, password) {
    await elasticUsers.updatePassword(username, password);
  }
};
