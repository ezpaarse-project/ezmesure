// @ts-check
const config = require('config');
const jwt = require('jsonwebtoken');
const elasticUsers = require('../services/elastic/users');
const usersPrisma = require('../services/prisma/users');
const { triggerHooks } = require('../hooks/hookEmitter');

const secret = config.get('auth.secret');
const adminUsername = config.get('admin.username');

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
    const fullName = config.get('admin.fullName');

    const adminData = {
      username,
      email,
      fullName,
      isAdmin: true,
      metadata: { acceptedTerms: true },
    };
    const admin = await usersPrisma.upsert({
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
    const user = await usersPrisma.create(params);
    triggerHooks('user:create', user);
    return user;
  }

  /**
   * @param {UserFindManyArgs} params
   * @returns {Promise<User[]>}
   */
  static findMany(params) {
    return usersPrisma.findMany(params);
  }

  /**
   * @param {UserFindUniqueArgs} params
   * @returns {Promise<User | null>}
   */
  static findUnique(params) {
    return usersPrisma.findUnique(params);
  }

  /**
   * @param {string} username
   * @returns {Promise<User | null>}
   */
  static findByUsername(username) {
    return usersPrisma.findUnique({ where: { username } });
  }

  /*
   * @param {UserFindUniqueOrThrowArgs} params
   * @returns {Promise<User>}
   */
  static findUniqueOrThrow(params) {
    return usersPrisma.findUniqueOrThrow(params);
  }

  /**
   * @param {string} domain
   * @returns {Promise<{email: string}[]> | null}
   */
  static findEmailOfCorrespondentsWithDomain(domain) {
    return usersPrisma.findMany({
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
    const user = await usersPrisma.update(params);
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
    return usersPrisma.update({
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
    const user = await usersPrisma.upsert(params);
    triggerHooks('user:upsert', user);
    return user;
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  static async delete(params) {
    const { deleteResult, deletedUser } = await usersPrisma.remove(params);

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
   * @returns {Promise<User | null>}
   */
  static deleteByUsername(username) {
    return usersPrisma.remove({ where: { username } });
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  static async updatePassword(username, password) {
    await elasticUsers.updatePassword(username, password);
  }

  /**
   * @param {string} username
   * @returns {Promise<string | null>}
   */
  static async generateToken(username) {
    const user = await UsersService.findByUsername(username);
    if (!user) {
      // TODO throw ?
      return null;
    }
    return jwt.sign({ username: user.username, email: user.email }, secret);
  }

  /**
   * @returns {Promise<Array<User> | null>}
   */
  static async deleteAll() {
    if (process.env.NODE_ENV === 'production') { return null; }
    const users = await this.findMany({
      where: { NOT: { username: adminUsername } },
    });

    await Promise.all(users.map(async (user) => {
      await this.delete({
        where: {
          username: user.username,
        },
      });
    }));

    return users;
  }
};
