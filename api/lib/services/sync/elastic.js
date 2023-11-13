// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');

const MembershipsService = require('../../entities/memberships.service');
const RepositoriesService = require('../../entities/repositories.service');
const UsersService = require('../../entities/users.service');

const {
  generateRoleNameFromRepository,
  generateUserRoles,
} = require('../../hooks/utils');
const { execThrottledPromises } = require('../promises');

const { upsertRole, deleteRole } = require('../elastic/roles');
const { getUserByUsername, upsertUser } = require('../elastic/users');

const { syncSchedule } = config.get('elasticsearch');

/**
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
};

/**
 * Sync Elastic's roles to ezMESURE's repositories
 * @returns {Promise<void>}
 */
const syncRepositories = async () => {
  const repositories = await RepositoriesService.findMany({});

  const executors = repositories.map((repo) => () => syncRepository(repo));

  const res = await execThrottledPromises(
    executors,
    (error) => appLogger.warn(`[elastic] Error on upserting repositories roles: ${error.message}`),
  );
  appLogger.verbose(`[elastic] Upserted ${res.fulfilled} repositories roles (${res.errors} errors)`);
};

/**
 * Sync Elastic's users' roles to ezMESURE's memberships
 */
const syncMemberships = async () => {
  const memberships = await MembershipsService.findMany({});

  const executors = memberships.map(
    (member) => async () => {
      /** @type {ElasticUser | User | null} */
      let user = await getUserByUsername(member.username);
      if (!user) {
        user = await UsersService.findUnique({ where: { username: member.username } });
        if (!user) {
          throw new Error(`User [${member.username}] doesn't exist, but have repository permissions`);
        }
      }

      const roles = await generateUserRoles(member.username);

      await upsertUser({
        username: user.username,
        email: user.email,
        fullName: 'fullName' in user ? user.fullName : user.full_name,
        roles,
      });
    },
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
  await syncMemberships();
};

/**
 * Start cron to periodically sync Elastic to ezMESURE
 */
const startCron = async () => {
  const job = new CronJob({
    cronTime: syncSchedule,
    runOnInit: true,
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
  syncMemberships,
  unmountRepository,
};
