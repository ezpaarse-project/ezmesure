// @ts-check
const config = require('config');
const jwt = require('jsonwebtoken');
const { addHours } = require('date-fns');
const BasePrismaService = require('./base-prisma.service');
const elasticUsers = require('../services/elastic/users');
const usersPrisma = require('../services/prisma/users');

const secret = config.get('auth.secret');
const passwordResetValidity = config.get('passwordResetValidity');

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

module.exports = class UsersService extends BasePrismaService {
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  static async updatePassword(username, password) {
    await elasticUsers.updatePassword(username, password);
  }

  static async generateTokenForActivate(username) {
    const currentDate = new Date();
    const expiresAt = addHours(currentDate, passwordResetValidity);

    return jwt.sign({
      username,
      createdAt: currentDate,
      expiresAt,
    }, secret);
  }

  /**
   * @returns {Promise<User>}
   */
  async createAdmin() {
    const { username, email, fullName } = config.get('admin');

    const adminData = {
      username,
      email,
      fullName,
      isAdmin: true,
      metadata: { acceptedTerms: true },
    };

    const admin = await usersPrisma.upsert(
      {
        where: { username },
        update: adminData,
        create: adminData,
      },
      this.prisma,
    );

    this.triggerHooks('user:create-admin', admin);

    return admin;
  }

  /**
   * @param {UserCreateArgs} params
   * @returns {Promise<User>}
   */
  async create(params) {
    const user = await usersPrisma.create(params, this.prisma);
    this.triggerHooks('user:create', user);
    return user;
  }

  /**
   * @param {UserFindManyArgs} params
   * @returns {Promise<User[]>}
   */
  findMany(params) {
    return usersPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {UserFindUniqueArgs} params
   * @returns {Promise<User | null>}
   */
  findUnique(params) {
    return usersPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} username
   * @returns {Promise<User | null>}
   */
  findByUsername(username) {
    return usersPrisma.findUnique({ where: { username } }, this.prisma);
  }

  /**
   * @param {UserFindUniqueOrThrowArgs} params
   * @returns {Promise<User>}
   */
  findUniqueOrThrow(params) {
    return usersPrisma.findUniqueOrThrow(params, this.prisma);
  }

  /**
   * @param {string} domain
   * @returns {Promise<{email: string}[]> | null}
   */
  findEmailOfCorrespondentsWithDomain(domain) {
    return usersPrisma.findEmailOfCorrespondentsWithDomain(domain, this.prisma);
  }

  /**
   * @param {UserUpdateArgs} params
   * @returns {Promise<User>}
   */
  async update(params) {
    // TODO manage role
    const user = await usersPrisma.update(params, this.prisma);
    this.triggerHooks('user:update', user);
    return user;
  }

  /**
   * Accept terms for user.
   * @param {string} username - Username.
   *
   * @returns {Promise<User>}
   */
  async acceptTerms(username) {
    const user = await usersPrisma.acceptTerms(username);
    this.triggerHooks('user:update', user);
    return user;
  }

  /**
   * @param {UserUpsertArgs} params
   * @returns {Promise<User>}
   */
  async upsert(params) {
    const user = await usersPrisma.upsert(params, this.prisma);
    this.triggerHooks('user:upsert', user);
    return user;
  }

  /**
   * @param {UserDeleteArgs} params
   * @returns {Promise<User | null>}
   */
  async delete(params) {
    const result = await usersPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    const { deleteResult, deletedUser } = result;

    this.triggerHooks('user:delete', deletedUser);

    deletedUser?.memberships?.forEach((element) => {
      this.triggerHooks('memberships:delete', element);

      element.repositoryPermissions.forEach((repoPerm) => { this.triggerHooks('repository_permission:delete', repoPerm); });
      element.spacePermissions.forEach((spacePerm) => { this.triggerHooks('space_permission:delete', spacePerm); });
    });

    return deleteResult;
  }

  /**
   * @param {string} username
   * @returns {Promise<User | null>}
   */
  removeByUsername(username) {
    const deletedUser = usersPrisma.removeByUsername(username);
    this.triggerHooks('user:delete', deletedUser);
    return deletedUser;
  }

  /**
   * @param {string} username
   * @returns {Promise<string | null>}
   */
  async generateToken(username) {
    const user = await this.findByUsername(username);
    if (!user) {
      // TODO throw ?
      return null;
    }
    return jwt.sign({ username: user.username, email: user.email }, secret);
  }

  /**
   * @returns {Promise<Array<User> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {UsersService} service */
    const transaction = async (service) => {
      const users = await service.findMany({});

      if (users.length === 0) { return null; }

      await Promise.all(
        users.map(
          (user) => service.delete({
            where: {
              username: user.username,
            },
          }),
        ),
      );

      return users;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return UsersService.$transaction(transaction);
  }
};
