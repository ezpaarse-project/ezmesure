// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const usersService = require('../../entities/users.service');
const { syncUser } = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').SpacePermission} SpacePermission
 */

/**
 * Synchronize the Elasticsearch user associated to a space permission
 * @param {SpacePermission} permission - The permission that was changed
 * @returns {Promise<void>}
 */
const onSpacePermissionModified = async (permission) => {
  const user = await usersService.findUnique({
    where: {
      username: permission.username,
    },
  });

  if (user) {
    try {
      await syncUser(user);
      appLogger.verbose(`[elastic][hooks] User [${user?.username}] has been updated`);
    } catch (error) {
      appLogger.error(`[elastic][hooks] User [${user?.username}] could not be updated:\n${error}`);
    }
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.username}_${permission.spaceId}` };

registerHook('space_permission:create', onSpacePermissionModified, hookOptions);
registerHook('space_permission:update', onSpacePermissionModified, hookOptions);
registerHook('space_permission:upsert', onSpacePermissionModified, hookOptions);
registerHook('space_permission:delete', onSpacePermissionModified, hookOptions);
