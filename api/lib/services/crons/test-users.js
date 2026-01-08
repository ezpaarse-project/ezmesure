// @ts-check
const { CronJob } = require('cron');
const config = require('config');
const { isBefore, isValid } = require('date-fns');

const { appLogger } = require('../logger');
const esUsers = require('../elastic/users');
const { isTestUser } = require('../elastic/test-users');

/**
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 */

const clean = config.get('testUsers.clean');

/**
 * Is test user expired
 *
 * @param {ElasticUser} user - The user to check
 *
 * @returns {boolean} `true` if the test user has expired
 */
const isExpired = (user) => {
  const expiresAt = new Date(user?.metadata?.expiresAt);
  return isValid(expiresAt) && isBefore(expiresAt, new Date());
};

async function removeExpiredTestUsers() {
  appLogger.verbose('[test-users] Checking for expired test users...');

  const testUsers = await esUsers.getUsersByWildcard('*__test__*');
  let nbExpired = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const user of testUsers) {
    if (isTestUser(user) && isExpired(user)) {
      nbExpired += 1;

      try {
        // eslint-disable-next-line no-await-in-loop
        await esUsers.deleteUser(user.username);
      } catch (e) {
        appLogger.error(`[test-users] Failed to delete expired test user [${user.username}]`, e);
      }
    }
  }

  appLogger.verbose(`[test-users] Found ${testUsers.length} test users, with ${nbExpired} expired`);
}

async function startExpiredCron() {
  const job = CronJob.from({
    cronTime: clean.schedule,
    runOnInit: true,
    onTick: async () => {
      await removeExpiredTestUsers();
    },
  });

  job.start();
}

module.exports = {
  startExpiredCron,
};
