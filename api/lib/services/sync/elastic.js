// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');

const RepositoriesService = require('../../entities/repositories.service');
const RepositoryAliasesService = require('../../entities/repository-aliases.service');
const SpacesService = require('../../entities/spaces.service');
const UsersService = require('../../entities/users.service');

const { syncIndexPatterns } = require('./kibana');

const {
  generateRoleNameFromRepository,
  generateRoleNameFromAlias,
  generateUserRoles,
} = require('../../hooks/utils');
const { execThrottledPromises } = require('../promises');

const { upsertRole, deleteRole } = require('../elastic/roles');
const { upsertUser } = require('../elastic/users');
const { upsertAlias } = require('../elastic/indices');
const { filtersToESQuery } = require('../elastic/filters');

const { syncSchedule } = config.get('elasticsearch');

/**
 * @typedef {import('../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * Remove roles associated to a repository
 * @param {Repository} repo - The repository to unmount
 * @returns {Promise<void>}
 */
const unmountRepository = async (repo) => {
  const readOnlyRole = generateRoleNameFromRepository(repo, 'readonly');
  const allRole = generateRoleNameFromRepository(repo, 'all');

  try {
    await deleteRole(readOnlyRole);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be deleted:\n${error}`);
  }

  try {
    await deleteRole(allRole);
    appLogger.verbose(`[elastic] Role [${allRole}] has been deleted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${allRole}] cannot be deleted:\n${error}`);
  }
};

/**
 * Synchronize a repository with Elasticsearch, making sure that associated roles exists
 * @param {Repository} repo - The repository to sync
 * @returns {Promise<void>}
 */
const syncRepository = async (repo) => {
  const readOnlyRole = generateRoleNameFromRepository(repo, 'readonly');
  const allRole = generateRoleNameFromRepository(repo, 'all');

  try {
    await upsertRole(readOnlyRole, [repo.pattern], ['read', 'view_index_metadata']);
    appLogger.verbose(`[elastic] Role [${readOnlyRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${readOnlyRole}] cannot be upserted:\n${error}`);
  }

  try {
    await upsertRole(allRole, [repo.pattern], ['all']);
    appLogger.verbose(`[elastic] Role [${allRole}] has been upserted`);
  } catch (error) {
    appLogger.error(`[elastic] Role [${allRole}] cannot be upserted:\n${error}`);
  }

  const spacesService = new SpacesService();

  const spacesOfSameType = await spacesService.findMany({
    where: {
      type: repo.type,
      institution: {
        repositories: {
          some: {
            pattern: repo.pattern,
          },
        },
      },
    },
  });

  await Promise.allSettled(spacesOfSameType.map((space) => syncIndexPatterns(space)));
};

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
const syncAlias = async (alias) => {
  const repositoryService = new RepositoriesService();
  const repo = await repositoryService.findUnique({ where: { pattern: alias.target } });
  if (!repo) {
    appLogger.error(`[elastic] Cannot create alias [${alias.pattern}], repository [${alias.target}] not found`);
    return;
  }

  const readOnlyRole = generateRoleNameFromAlias(alias, repo);

  try {
    await upsertRole(readOnlyRole, [alias.pattern], ['read', 'view_index_metadata']);
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
 * Sync Elastic's roles to ezMESURE's repositories
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositories = async () => {
  const repositoriesService = new RepositoriesService();
  const repositories = await repositoriesService.findMany({});

  const executors = repositories.map((repo) => () => syncRepository(repo));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repositories roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repositories roles (${res.errors} errors)`);

  return res;
};

/**
 * Sync Elastic's roles to ezMESURE's repository aliases
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositoryAliases = async () => {
  const repositoryAliasesService = new RepositoryAliasesService();
  const aliases = await repositoryAliasesService.findMany({});

  const executors = aliases.map((alias) => () => syncAlias(alias));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repository aliases roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repository aliases roles (${res.errors} errors)`);

  return res;
};

/**
 * Sync an Elasticsearch user with a given membership
 * @param {User} user - The user to synchronize
 */
const syncUser = async (user) => {
  const roles = await generateUserRoles(user.username);

  await upsertUser({
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    roles,
  });
};

/**
 * Sync Elastic's users' roles to ezMESURE's memberships
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncUsers = async () => {
  const usersService = new UsersService();
  const users = await usersService.findMany({});

  const executors = users.map(
    (user) => async () => syncUser(user),
  );

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting roles for users: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted roles for ${res.fulfilled} users (${res.errors} errors)`);
  return res;
};

const sync = async () => {
  await syncRepositories();
  await syncUsers();
};

/**
 * Start cron to periodically sync Elastic to ezMESURE
 */
const startCron = async () => {
  const job = CronJob.from({
    cronTime: syncSchedule,
    runOnInit: false,
    onTick: async () => {
      appLogger.verbose('[elastic] Starting synchronization');
      try {
        await sync();
        appLogger.info('[elastic] Synchronized');
      } catch (e) {
        const message = e?.response?.data?.content?.message || e.message;
        appLogger.error(`[elastic] Failed to synchronize: ${message}`);
      }
    },
  });

  job.start();
};

module.exports = {
  startCron,
  sync,
  syncRepository,
  syncAlias,
  syncRepositories,
  syncRepositoryAliases,
  syncUser,
  syncUsers,
  unmountRepository,
  unmountAlias,
};
