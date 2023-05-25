// @ts-check
const config = require('config');
const { client: prisma, Prisma } = require('../services/prisma.service');
const elastic = require('../services/elastic/users');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').User} User */
/** @typedef {import('@prisma/client').Prisma.UserUpsertArgs} UserUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.UserFindUniqueArgs} UserFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.UserFindManyArgs} UserFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.UserUpdateArgs} UserUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.UserCreateArgs} UserCreateArgs */
/** @typedef {import('@prisma/client').Prisma.UserDeleteArgs} UserDeleteArgs */
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

    await elastic.createAdmin();

    return prisma.user.upsert({
      where: { username },
      update: adminData,
      create: adminData,
    });
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<User>}
   */
  static async create(params) {
    const userData = {
      username: params.data.username,
      email: params.data.email,
      fullName: params.data.fullName,
      roles: [],
    };
    await elastic.upsertUser(userData);

    return prisma.user.create(params);
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
            OR: [
              { isDocContact: true },
              { isTechContact: true },
            ],
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
    const userData = {
      username: params.data.username?.toString() || '',
      email: params.data.email?.toString() || '',
      fullName: params.data.fullName?.toString() || '',
      metadata: {
        passwordDate: params.data?.metadata?.passwordDate?.toString() || '',
      },
    };

    await elastic.updateUser(userData);
    return prisma.user.update(params);
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
    const elasticUser = await elastic.getUser(params?.create?.username);
    if (!elasticUser) {
      const userData = {
        username: params?.create?.username,
        email: params?.create?.email,
        fullName: params?.create?.fullName,
      };
      await elastic.upsertUser(userData);
    }

    return prisma.user.upsert(params);
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  static async delete(params) {
    if (params?.where?.username) {
      await elastic.deleteUser(params.where.username);
    }

    return prisma.user.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User>}
   */
  static async updatePassword(username, password) {
    return elastic.updatePassword(username, password);
  }
};
