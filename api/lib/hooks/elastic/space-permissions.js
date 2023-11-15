// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');

const { generateUserRoles } = require('../utils');

/**
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 */

/**
 * @param { SpacePermission } permission
 */
const onSpacePermissionModified = async (permission) => {
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

registerHook('space_permission:create', onSpacePermissionModified);
registerHook('space_permission:update', onSpacePermissionModified);
registerHook('space_permission:upsert', onSpacePermissionModified);
registerHook('space_permission:delete', onSpacePermissionModified);
