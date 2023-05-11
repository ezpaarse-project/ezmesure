// @ts-check
const config = require('config');
const { client: prisma, Prisma } = require('../services/prisma.service');
const elastic = require('../services/elastic/users');
const ezrUsers = require('../services/ezreeport/users');

const {
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('./memberships.dto');

/* eslint-disable max-len */
/** @typedef {Map<'elastic' | 'ezreeport', true | Error>} SyncMap Key is the service, value is `true` if synced, an error is not */
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
   * @returns {Promise<{ data: User, syncMap: SyncMap }>}
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

    /** @type {SyncMap} */
    const syncMap = new Map();
    try {
      await elastic.createAdmin();
      syncMap.set('elastic', true);
    } catch (error) {
      syncMap.set('elastic', error);
    }

    try {
      await ezrUsers.upsertFromUser(admin);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: admin,
      syncMap,
    };
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<{ data: User, syncMap: SyncMap }>}
   */
  static async create(params) {
    const user = await prisma.user.create(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    try {
      const userData = {
        username: params.data.username,
        email: params.data.email,
        fullName: params.data.fullName,
      };

      await elastic.createUser(userData);
      syncMap.set('elastic', true);
    } catch (error) {
      syncMap.set('elastic', error);
    }

    try {
      await ezrUsers.upsertFromUser(user);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: user,
      syncMap,
    };
  }

  /**
   * @param {UserFindManyArgs} params
   * @returns {Promise<{ data: User[] }>}
   */
  static async findMany(params) {
    return { data: await prisma.user.findMany(params) };
  }

  /**
   * @param {UserFindUniqueArgs} params
   * @returns {Promise<{ data: User | null }>}
   */
  static async findUnique(params) {
    return { data: await prisma.user.findUnique(params) };
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
   * @returns {Promise<{ data: User, syncMap: SyncMap }>}
   */
  static async update(params) {
    // TODO manage role

    const user = await prisma.user.update(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    try {
      const userData = {
        username: params.data.username?.toString() || '',
        email: params.data.email?.toString() || '',
        fullName: params.data.fullName?.toString() || '',
      };

      await elastic.updateUser(userData);
      syncMap.set('elastic', true);
    } catch (error) {
      syncMap.set('elastic', error);
    }

    try {
      await ezrUsers.upsertFromUser(user);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: user,
      syncMap,
    };
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
   * @returns {Promise<{ data: User, syncMap: SyncMap }>}
   */
  static async upsert(params) {
    const user = await prisma.user.upsert(params);

    /** @type {SyncMap} */
    const syncMap = new Map();
    try {
      const userData = {
        username: params?.create?.username,
        email: params?.create?.email,
        fullName: params?.create?.fullName,
      };

      await elastic.createUser(userData);
      syncMap.set('elastic', true);
    } catch (error) {
      syncMap.set('elastic', error);
    }

    try {
      await ezrUsers.upsertFromUser(user);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: user,
      syncMap,
    };
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<{ data: User | null, syncMap: SyncMap }>}
   */
  static async delete(params) {
    let user;
    /** @type {SyncMap} */
    const syncMap = new Map();

    try {
      user = await prisma.user.delete(params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return { data: null, syncMap };
      }
      throw error;
    }

    if (params.where.username) {
      try {
        await elastic.deleteUser(params.where.username);
        syncMap.set('elastic', true);
      } catch (error) {
        syncMap.set('elastic', error);
      }
    }

    try {
      await ezrUsers.deleteFromUser(user);
      syncMap.set('ezreeport', true);
    } catch (error) {
      syncMap.set('ezreeport', error);
    }

    return {
      data: user,
      syncMap,
    };
  }
};
