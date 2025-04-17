// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { syncCustomRole } = require('../../services/sync/kibana');

/**
 * @typedef {import('@prisma/client').ElasticRoleSpacePermission} ElasticRoleSpacePermission
 */

/**
 * @param {ElasticRoleSpacePermission} permission - The permission that was changed
 */
const onSpacePermissionModified = async (permission) => {
  try {
    await syncCustomRole(permission.elasticRoleName);
  } catch (error) {
    appLogger.error(
      `[kibana][hooks] elastic role [${permission.elasticRoleName}] could not be synchronized:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.elasticRoleName}_${permission.spaceId}` };

registerHook('elastic_role_space_permission:create', onSpacePermissionModified, hookOptions);
registerHook('elastic_role_space_permission:update', onSpacePermissionModified, hookOptions);
registerHook('elastic_role_space_permission:upsert', onSpacePermissionModified, hookOptions);
registerHook('elastic_role_space_permission:delete', onSpacePermissionModified, hookOptions);
