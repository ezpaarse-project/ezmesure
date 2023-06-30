// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');

const { generateRolesOfMembership } = require('../utils');

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

  const roles = await generateRolesOfMembership(permission.username, permission.institutionId);
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

hookEmitter.on('space_permission:create', onSpacePermissionModified);
hookEmitter.on('space_permission:update', onSpacePermissionModified);
hookEmitter.on('space_permission:upsert', onSpacePermissionModified);
hookEmitter.on('space_permission:delete', onSpacePermissionModified);
