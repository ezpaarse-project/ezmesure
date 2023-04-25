// @ts-check
const config = require('config');
const { client: prisma, Prisma } = require('../services/prisma.service');
const elastic = require('../services/elastic');

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
    const password = config.get('admin.password');
    const email = config.get('admin.email');
    const fullName = 'ezMESURE Administrator';

    const adminData = {
      username,
      email,
      fullName,
      isAdmin: true,
      metadata: { acceptedTerms: true },
    };

    await elastic.security.putUser({
      username,
      refresh: true,
      body: {
        password,
        email,
        full_name: fullName,
        roles: ['superuser'],
      },
    });

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
  static create(params) {
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
   * @param {UserUpdateArgs} params
   * @returns {Promise<User>}
   */
  static update(params) {
    return prisma.user.update(params);
  }

  /**
   * @param {UserUpsertArgs} params
   * @returns {Promise<User>}
   */
  static upsert(params) {
    return prisma.user.upsert(params);
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  static delete(params) {
    return prisma.user.delete(params).catch((e) => {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return null;
      }
      throw e;
    });
  }
};
