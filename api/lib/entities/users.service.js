// @ts-check
const config = require('config');
const elasticUsers = require('../services/elastic/users');
const { client: prisma, Prisma } = require('../services/prisma.service');
const hooks = require('../hooks/hookEmitter');

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

    hooks.emit('user:create-admin', admin);

    return admin;
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<User>}
   */
  static async create(params) {
    const user = await prisma.user.create(params);
    hooks.emit('user:create', user);
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
    hooks.emit('user:update', user);
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
    hooks.emit('user:upsert', user);
    return user;
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  static async delete(params) {
    let user;

    try {
      user = await prisma.user.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }

    hooks.emit('user:delete', user);

    return user;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User>}
   */
  static async updatePassword(username, password) {
    return elasticUsers.updatePassword(username, password);
  }
};
