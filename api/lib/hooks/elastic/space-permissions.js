// @ts-check
const hookEmitter = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { client: prisma } = require('../../services/prisma.service');
const elasticUsers = require('../../services/elastic/users');

const { generateRoleNameFromSpace } = require('../utils');

/**
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 */

/**
 * @param { SpacePermission } permission
 */
const onSpacePermissionUpsert = async (permission) => {
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

  let space;
  try {
    space = await prisma.space.findUnique({
      where: { id: permission.spaceId },
    });
    if (!space) {
      throw new Error('space not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] space [${permission.spaceId}] cannot be getted: ${error.message}`);
    return;
  }

  /** @type {{roles: string[]}} */
  let { roles } = user;
  const readonlyRole = generateRoleNameFromSpace(space, 'readonly');
  const allRole = generateRoleNameFromSpace(space, 'all');

  if (permission.readonly) {
    roles = roles.filter((r) => r !== allRole);
    roles.push(readonlyRole);
  } else {
    roles = roles.filter((r) => r !== readonlyRole);
    roles.push(allRole);
  }

  try {
    await elasticUsers.updateUser({
      username: permission.username,
      email: user.email,
      fullName: user.full_name,
      roles: [...new Set([...roles])],
    });
    appLogger.verbose(`[elastic][hooks] User [${permission.username}] is updated`);
  } catch (error) {
    appLogger.error(`[elastic][hooks] User [${permission.username}] cannot be updated: ${error.message}`);
  }
};

/**
 * @param { SpacePermission } permission
 */
const onSpacePermissionDelete = async (permission) => {
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

  let space;
  try {
    space = await prisma.space.findUnique({
      where: { id: permission.spaceId },
    });
    if (!space) {
      throw new Error('space not found');
    }
  } catch (error) {
    appLogger.error(`[elastic][hooks] space [${permission.spaceId}] cannot be getted: ${error.message}`);
    return;
  }

  const oldRole = generateRoleNameFromSpace(space, permission.readonly ? 'readonly' : 'all');
  const roles = user.roles.filter((r) => r !== oldRole);

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

hookEmitter.on('space_permission:create', onSpacePermissionUpsert);
hookEmitter.on('space_permission:update', onSpacePermissionUpsert);
hookEmitter.on('space_permission:upsert', onSpacePermissionUpsert);
hookEmitter.on('space_permission:delete', onSpacePermissionDelete);
