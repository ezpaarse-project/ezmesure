// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');
const { syncUser } = require('../../services/sync/elastic/users');

/**
 * @typedef {import('../../.prisma/client.mjs').RepositoryPermission} RepositoryPermission
 */

/**
 * @param { RepositoryPermission } permission
 */
const onRepositoryPermissionModified = async (permission) => {
  let user;
  try {
    user = await elasticUsers.getUserByUsername(permission.username);
    if (!user) {
      throw new Error('User not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be getted: ${error.message}`);
    return;
  }

  try {
    await syncUser(user);
    appLogger.verbose(`[elastic][hooks] User [${permission.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be updated: ${error.message}`);
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.username}_${permission.repositoryPattern}` };

registerHook('repository_permission:create', onRepositoryPermissionModified, hookOptions);
registerHook('repository_permission:update', onRepositoryPermissionModified, hookOptions);
registerHook('repository_permission:upsert', onRepositoryPermissionModified, hookOptions);
registerHook('repository_permission:delete', onRepositoryPermissionModified, hookOptions);
