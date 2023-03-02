// @ts-check
const prisma = require('../services/prisma.service');

/** @typedef {import('@prisma/client').User} User */
/** @typedef {import('@prisma/client').Prisma.UserUpsertArgs} UserUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.UserFindUniqueArgs} UserFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.UserFindManyArgs} UserFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.UserUpdateArgs} UserUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.UserCreateArgs} UserCreateArgs */

module.exports = class UsersService {
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
};
