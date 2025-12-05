// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const {
  syncCustomRole,
} = require('../../services/sync/kibana');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').ElasticRoleRepositoryPermission} ElasticRoleRepositoryPermission
*/
/* eslint-enable max-len */

/**
 * @param { ElasticRoleRepositoryPermission } permission
 */
const onRepositoryPermissionModified = async (permission) => {
  try {
    await syncCustomRole(permission.elasticRoleName);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] elastic role [${permission.elasticRoleName}] could not be synchronized:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (permission) => `${permission.elasticRoleName}_${permission.repositoryPattern}` };

registerHook('elastic_role_repository_permission:create', onRepositoryPermissionModified, hookOptions);
registerHook('elastic_role_repository_permission:update', onRepositoryPermissionModified, hookOptions);
registerHook('elastic_role_repository_permission:upsert', onRepositoryPermissionModified, hookOptions);
registerHook('elastic_role_repository_permission:delete', onRepositoryPermissionModified, hookOptions);
