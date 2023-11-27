// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');

/**
 * @typedef {import('@prisma/client').User} User
 */

/**
 * @param {User} user
 */
const onAdminUserCreate = async (user) => {
  try {
    await elasticUsers.createAdmin();
    appLogger.verbose(`[elastic][hooks] Admin user [${user.username}] is created`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] Admin user [${user.username}] cannot be created: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserCreate = async (user) => {
  try {
    await elasticUsers.createUser({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: [],
    });
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is created`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be created: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpdate = async (user) => {
  let elasticUser;
  try {
    elasticUser = await elasticUsers.getUserByUsername(user.username);
    if (!elasticUser) {
      throw new Error('User not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be getted: ${error.message}`);
    return;
  }

  try {
    await elasticUsers.updateUser({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: elasticUser.roles,
    });
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be updated: ${error.message}`);
  }
};

/**
 * @param {User} user
 */
const onUserDelete = async (user) => {
  try {
    await elasticUsers.deleteUser(user.username);
    appLogger.verbose(`[elastic][hooks] User [${user.username}] is deleted`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be deleted: ${error.message}`);
  }
};

/**
 * @param {Array<string>} listOfUsername
 */
const onUserDeleteAll = async (listOfUsername) => {
  if (process.env.NODE_ENV === 'production') { return null; }
  const usersRes = await Promise.allSettled(
    listOfUsername.map(async (username) => {
      try {
        await elasticUsers.deleteUser(username);
        appLogger.verbose(`[elastic][hooks] User [${username}] is deleted`);
      } catch (error) {
        appLogger.error(`[elastic][hooks] User [${username}] cannot be deleted: ${error.message}`);
        throw error;
      }
    }),
  );

  const userErrors = usersRes.filter((v) => v.status === 'rejected').length;
  const userDeleted = usersRes.length - userErrors;

  appLogger.info(`[elastic][hooks] Delete all users : ${userErrors} errors, ${userDeleted} deleted`);
};

/**
 * @param {User} user
 */
const onUserUpsert = async (user) => {
  try {
    // Using events of THIS event handler (not the whole bus)
    if (await elasticUsers.getUserByUsername(user.username)) {
      return onUserUpdate(user);
    }

    return onUserCreate(user);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be upserted: ${error.message}`);
  }
};

hookEmitter.on('user:create-admin', onAdminUserCreate);
hookEmitter.on('user:create', onUserCreate);
hookEmitter.on('user:update', onUserUpdate);
hookEmitter.on('user:upsert', onUserUpsert);
hookEmitter.on('user:delete', onUserDelete);
hookEmitter.on('user:deleteAll', onUserDeleteAll);
