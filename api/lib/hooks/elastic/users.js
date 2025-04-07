// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');
const { syncUser } = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').ElasticRole} ElasticRole
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
    await syncUser(user);
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

/**
 * @param {{ user: User, role: ElasticRole }} param0
 */
const onUserRoleUpdate = async ({ user }) => {
  try {
    await syncUser(user);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${user.username}] cannot be sync: ${error.message}`);
  }
};

const hookOptions = { uniqueResolver: (user) => user.username };

registerHook('user:create-admin', onAdminUserCreate, hookOptions);
registerHook('user:create', onUserCreate, hookOptions);
registerHook('user:update', onUserUpdate, hookOptions);
registerHook('user:upsert', onUserUpsert, hookOptions);
registerHook('user:delete', onUserDelete, hookOptions);
registerHook('user:connect:elastic_role', onUserRoleUpdate, hookOptions);
registerHook('user:disconnect:elastic_role', onUserRoleUpdate, hookOptions);
