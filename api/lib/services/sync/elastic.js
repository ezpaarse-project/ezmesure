// @ts-check
const config = require('config');
const { CronJob } = require('cron');
const { appLogger } = require('../logger');

const MembershipsService = require('../../entities/memberships.service');
const RepositoriesService = require('../../entities/repositories.service');
const UsersService = require('../../entities/users.service');

const {
  generateRoleNameFromRepository,
  generateRolesOfMembership,
} = require('../../hooks/utils');
const { execThrottledPromises } = require('../promises');

const { upsertRole } = require('../elastic/roles');
const { getUserByUsername, upsertUser } = require('../elastic/users');

const { syncSchedule } = config.get('elasticsearch');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 */

/**
 * Sync Elastic's roles to ezMESURE's repositories
 */
const syncRepositories = async () => {
  const repositories = await RepositoriesService.findMany({});

  const executors = repositories.map(
    (repo) => async () => {
      await upsertRole(
        generateRoleNameFromRepository(repo, 'readonly'),
        [repo.pattern],
        ['read'],
      );

      await upsertRole(
        generateRoleNameFromRepository(repo, 'all'),
        [repo.pattern],
        ['all'],
      );
    },
  );

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

      const roles = await generateRolesOfMembership(member.username, member.institutionId);

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
};
