// @ts-check
const config = require('config');
const { client: prisma, Prisma } = require('../services/prisma.service');
const elastic = require('../services/elastic/users');
const ezreeport = require('../services/ezreeport');
const { appLogger } = require('../services/logger');

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
    const admin = await prisma.user.upsert({
      where: { username },
      update: adminData,
      create: adminData,
    });

    try {
      await elastic.createAdmin();
      appLogger.verbose(`[elastic] Created admin [${username}]`);
    } catch (error) {
      appLogger.error(`[elastic] Cannot create admin [${username}]: ${error.message}`);
    }

    try {
      const { wasCreated } = await ezreeport.user.upsertFromUser(admin);
      appLogger.verbose(`[ezReeport] Created admin [${username}]`);
      if (!wasCreated) {
        appLogger.warn(`[ezReeport] Admin [${username}] was edited instead of being created`);
      }
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot create admin [${username}]: ${error.message}`);
    }

    return admin;
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<User>}
   */
  static async create(params) {
    const user = await prisma.user.create(params);

    try {
      const userData = {
        username: params.data.username,
        email: params.data.email,
        fullName: params.data.fullName,
      };

      await elastic.createUser(userData);
      appLogger.verbose(`[elastic] Created user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[elastic] Cannot create user [${user.username}]: ${error.message}`);
    }

    try {
      const { wasCreated } = await ezreeport.user.upsertFromUser(user);
      appLogger.verbose(`[ezReeport] Created user [${user.username}]`);
      if (!wasCreated) {
        appLogger.warn(`[ezReeport] User [${user.username}] was edited instead of being created`);
      }
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot create user [${user.username}]: ${error.message}`);
    }

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
   * @param {UserUpdateArgs} params
   * @returns {Promise<User>}
   */
  static async update(params) {
    // TODO manage role

    const user = await prisma.user.update(params);

    try {
      const userData = {
        username: params.data.username?.toString() || '',
        email: params.data.email?.toString() || '',
        fullName: params.data.fullName?.toString() || '',
      };

      await elastic.updateUser(userData);
      appLogger.verbose(`[elastic] Edited user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[elastic] Cannot create user [${user.username}]: ${error.message}`);
    }

    try {
      const { wasCreated } = await ezreeport.user.upsertFromUser(user);
      appLogger.verbose(`[ezReeport] Edited user [${user.username}]`);
      if (wasCreated) {
        appLogger.warn(`[ezReeport] User [${user.username}] was created instead of being edited`);
      }
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot edit user [${user.username}]: ${error.message}`);
    }

    return user;
  }

  /**
   * @param {UserUpsertArgs} params
   * @returns {Promise<User>}
   */
  static async upsert(params) {
    const user = await prisma.user.upsert(params);

    try {
      const userData = {
        username: params?.create?.username,
        email: params?.create?.email,
        fullName: params?.create?.fullName,
      };

      await elastic.createUser(userData);
      appLogger.verbose(`[elastic] Upserted user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[elastic] Cannot create user [${user.username}]: ${error.message}`);
    }

    try {
      await ezreeport.user.upsertFromUser(user);
      appLogger.verbose(`[ezReeport] Upserted user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot upsert user [${user.username}]: ${error.message}`);
    }

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

    try {
      await elastic.deleteUser(params.where.username);
      appLogger.verbose(`[elastic] Deleted user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[elastic] Cannot delete user [${user.username}]: ${error.message}`);
    }

    try {
      await ezreeport.user.deleteFromUser(user);
      appLogger.verbose(`[ezReeport] Deleted user [${user.username}]`);
    } catch (error) {
      appLogger.error(`[ezReeport] Cannot delete user [${user.username}]: ${error.message}`);
    }

    return user;
  }
};
