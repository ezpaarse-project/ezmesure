// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncCustomRole,
} = require('../../services/sync/elastic');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').ElasticRoleRepositoryAliasPermission} ElasticRoleRepositoryAliasPermission
*/
/* eslint-enable max-len */

/**
 * @param { ElasticRoleRepositoryAliasPermission } permission
 */
const onAliasPermissionModified = async (permission) => {
  try {
    await syncCustomRole(permission.elasticRoleName);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] elastic role [${permission.elasticRoleName}] could not be synchronized:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.elasticRoleName}_${permission.aliasPattern}` };

registerHook('elastic_role_repository_alias_permission:create', onAliasPermissionModified, hookOptions);
registerHook('elastic_role_repository_alias_permission:update', onAliasPermissionModified, hookOptions);
registerHook('elastic_role_repository_alias_permission:upsert', onAliasPermissionModified, hookOptions);
registerHook('elastic_role_repository_alias_permission:delete', onAliasPermissionModified, hookOptions);
