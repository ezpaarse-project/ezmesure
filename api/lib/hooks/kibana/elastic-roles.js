// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { syncCustomRole, unmountCustomRole } = require('../../services/sync/kibana');

/**
 * @typedef {import('../../.prisma/client').ElasticRole} ElasticRole
 */

/**
 * @param { ElasticRole } role
 */
const onRoleUpsert = async (role) => {
  try {
    await syncCustomRole(role?.name);
  } catch (error) {
    appLogger.error(
      `[kibana][hooks] elastic role [${role?.name}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param {ElasticRole} role - The role that was changed
 */
const onRoleDelete = async (role) => {
  try {
    await unmountCustomRole(role.name);
  } catch (error) {
    appLogger.error(
      `[kibana][hooks] elastic role [${role.name}] could not be synchronized:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (role) => role.name };

registerHook('elastic_role:create', onRoleUpsert, hookOptions);
registerHook('elastic_role:update', onRoleUpsert, hookOptions);
registerHook('elastic_role:upsert', onRoleUpsert, hookOptions);
registerHook('elastic_role:delete', onRoleDelete, hookOptions);
