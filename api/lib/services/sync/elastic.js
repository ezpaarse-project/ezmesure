// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');

const RepositoriesService = require('../../entities/repositories.service');
const SpacesService = require('../../entities/spaces.service');
const UsersService = require('../../entities/users.service');

const { syncIndexPatterns } = require('./kibana');

const {
  generateRoleNameFromRepository,
  generateUserRoles,
} = require('../../hooks/utils');
const { execThrottledPromises } = require('../promises');

const { upsertRole, deleteRole } = require('../elastic/roles');
const { upsertUser } = require('../elastic/users');

const { syncSchedule } = config.get('elasticsearch');

/**
 * @typedef {import('../promises').ThrottledPromisesResult} ThrottledPromisesResult
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 * @typedef {import('@prisma/client').Repository} Repository
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

  const spacesOfSameType = await SpacesService.findMany({
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
 * Sync Elastic's roles to ezMESURE's repositories
 * @returns {Promise<ThrottledPromisesResult>}
 */
const syncRepositories = async () => {
  const repositories = await RepositoriesService.findMany({});

  const executors = repositories.map((repo) => () => syncRepository(repo));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repositories roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repositories roles (${res.errors} errors)`);

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
  const users = await UsersService.findMany({});

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
  syncRepositories,
  syncUser,
  syncUsers,
  unmountRepository,
};
