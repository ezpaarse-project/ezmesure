// @ts-check
const prisma = require('../../prisma');
const { appLogger } = require('../../logger');
const { execThrottledPromises } = require('../../promises');

const ElasticRoleService = require('../../../entities/elastic-roles.service');

const { upsertRole, deleteRole } = require('../../elastic/roles');
const { generateElasticPermissions } = require('../../../hooks/utils');

/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').ElasticRole} ElasticRole
 */

/**
 * Delete custom role in elastic
 *
 * @param {ElasticRole} role - The role to sync
 * @returns {Promise<void>}
 */
async function unmountCustomRole(role) {
  try {
    await deleteRole(role.name);
    appLogger.verbose(`[elastic] Role [${role.name}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${role.name}] cannot be deleted:\n${error}`);
  }
}

/**
 * Sync a custom role in elastic
 *
 * @param {string} roleName - The role to sync
 * @returns {Promise<void>}
 */
async function syncCustomRole(roleName) {
  const role = await prisma.client.elasticRole.findUnique({
    where: { name: roleName },
    include: {
      repositoryPermissions: true,
      repositoryAliasPermissions: true,
    },
  });
  if (!role) {
    appLogger.error(`[elastic] Cannot create custom role [${roleName}], role not found`);
    return;
  }

  try {
    /** @type {[string, { privileges: string[] }][]} */
    const repositoryPermissions = role.repositoryPermissions.map(
      (p) => [p.repositoryPattern, generateElasticPermissions(p)],
    );
    /** @type {[string, { privileges: string[] }][]} */
    const aliasPermissions = role.repositoryAliasPermissions.map(
      (p) => [p.aliasPattern, generateElasticPermissions({ readonly: true })],
    );

    const permissions = new Map([...repositoryPermissions, ...aliasPermissions]);
    await upsertRole(role.name, permissions);
    appLogger.verbose(`[elastic] Role [${role.name}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${role.name}] cannot be upserted:\n${error}`);
  }
}

/**
 * Sync all custom roles in elastic
 *
 * @returns {Promise<ThrottledPromisesResult>}
 */
async function syncCustomRoles() {
  const elasticRoleService = new ElasticRoleService();
  const roles = await elasticRoleService.findMany({});

  const executors = roles.map((role) => () => syncCustomRole(role.name));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting custom roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} custom roles (${res.errors} errors)`);

  return res;
}

module.exports = {
  unmountCustomRole,
  syncCustomRoles,
  syncCustomRole,
};
