// @ts-check
const { appLogger } = require('../../logger');

const RepositoriesService = require('../../../entities/repositories.service');
const RepositoryAliasesService = require('../../../entities/repository-aliases.service');
const SpacesService = require('../../../entities/spaces.service');

const { syncIndexPatterns } = require('../kibana');

const {
  generateRoleNameFromRepository,
  generateRoleNameFromAlias,
  generateElasticPermissions,
} = require('../../../hooks/utils');
const { execThrottledPromises } = require('../../promises');

const { upsertRole, deleteRole } = require('../../elastic/roles');
const { upsertAlias } = require('../../elastic/indices');
const { filtersToESQuery } = require('../../elastic/filters');

/**
 * @typedef {import('../../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * Remove roles associated to a repository alias
 * @param {RepositoryAlias} alias - The repository to sync
 * @returns {Promise<void>}
 */
const unmountAlias = async (alias) => {
  const repositoryService = new RepositoriesService();
  const repo = await repositoryService.findUnique({ where: { pattern: alias.target } });
  if (!repo) {
    appLogger.error(`[elastic] Cannot unmount alias [${alias.pattern}], repository [${alias.target}] not found`);
    return;
  }

  const readOnlyRole = generateRoleNameFromRepository(repo, 'readonly');

  try {
    await deleteRole(readOnlyRole);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be deleted:\n${error}`);
  }
};

/**
 * Synchronize a repository alias with Elasticsearch, making sure that associated roles exists
 * @param {RepositoryAlias} alias - The repository to sync
 * @returns {Promise<void>}
 */
const syncRepositoryAlias = async (alias) => {
  const repositoryService = new RepositoriesService();
  const repo = await repositoryService.findUnique({ where: { pattern: alias.target } });
  if (!repo) {
    appLogger.error(`[elastic] Cannot create alias [${alias.pattern}], repository [${alias.target}] not found`);
    return;
  }

  const readOnlyRole = generateRoleNameFromAlias(alias, repo);

  try {
    const permissions = new Map([[alias.pattern, generateElasticPermissions({ readonly: true })]]);
    await upsertRole(readOnlyRole, permissions);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be upserted:\n${error}`);
  }

  let filters;
  if (alias.filters) {
    filters = filtersToESQuery(alias.filters);
  }

  try {
    await upsertAlias(alias.pattern, repo.pattern, filters);
    appLogger.verbose(`[elastic] Alias [${alias.pattern}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Alias [${alias.pattern}] cannot be upserted:\n${error}`);
  }

  const spacesService = new SpacesService();

  const spacesOfSameType = await spacesService.findMany({
    where: {
      type: repo.type,
      institution: {
        repositoryAliases: {
          some: {
            pattern: alias.pattern,
          },
        },
      },
    },
  });

  await Promise.allSettled(spacesOfSameType.map((space) => syncIndexPatterns(space)));
};

/**
 * Sync Elastic's roles to ezMESURE's repository aliases
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositoryAliases = async () => {
  const repositoryAliasesService = new RepositoryAliasesService();
  const aliases = await repositoryAliasesService.findMany({});

  const executors = aliases.map((alias) => () => syncRepositoryAlias(alias));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repository aliases roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repository aliases roles (${res.errors} errors)`);

  return res;
};

module.exports = {
  unmountAlias,
  syncRepositoryAlias,
  syncRepositoryAliases,
};
