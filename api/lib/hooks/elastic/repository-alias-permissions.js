// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');

const { generateUserRoles } = require('../utils');

/**
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
 */

/**
 * @param { RepositoryPermission } permission
 */
const onAliasPermissionModified = async (permission) => {
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

  const roles = await generateUserRoles(permission.username);
  try {
    await elasticUsers.updateUser({
      username: permission.username,
      email: user.email,
      fullName: user.full_name,
      roles,
    });
    appLogger.verbose(`[elastic][hooks] User [${permission.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be updated: ${error.message}`);
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.username}_${permission.aliasPattern}` };

registerHook('repository_alias_permission:create', onAliasPermissionModified, hookOptions);
registerHook('repository_alias_permission:update', onAliasPermissionModified, hookOptions);
registerHook('repository_alias_permission:upsert', onAliasPermissionModified, hookOptions);
registerHook('repository_alias_permission:delete', onAliasPermissionModified, hookOptions);
