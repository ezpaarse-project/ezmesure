// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const elasticUsers = require('../../services/elastic/users');

const { generateRolesOfMembership } = require('../utils');

/**
 * @typedef {import('@prisma/client').RepositoryPermission} RepositoryPermission
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

hookEmitter.on('repository_permission:create', onRepositoryPermissionModified);
hookEmitter.on('repository_permission:update', onRepositoryPermissionModified);
hookEmitter.on('repository_permission:upsert', onRepositoryPermissionModified);
hookEmitter.on('repository_permission:delete', onRepositoryPermissionModified);
