const crypto = require('node:crypto');
const { addMinutes } = require('date-fns');
const { CronJob } = require('cron');
const config = require('config');
const { isBefore, isValid } = require('date-fns');

const { appLogger } = require('../logger');
const esUsers = require('./users');

const clean = config.get('testUsers.clean');
const defaultLifespan = Number.parseInt(config.get('testUsers.lifespan.default'), 10);

const isTestUser = (user) => user?.metadata?.isTestUser === true;

const isCloneOf = (user, username) => (user?.metadata?.cloneOf === username);

const isExpired = (user) => {
  const expiresAt = new Date(user?.metadata?.expiresAt);
  return isValid(expiresAt) && isBefore(expiresAt, new Date());
};

const getAll = async () => {
  const users = await esUsers.getUsersByWildcard('*__test__*');

  return users.filter((user) => isTestUser(user));
};

const getManyByUsername = async (username) => {
  const users = await esUsers.getUsersByWildcard(`${username}__test__*`);

  return users.filter((user) => isTestUser(user) && isCloneOf(user, username));
};

const createTestUser = async (sourceUser, opts = {}) => {
  const { lifespan } = opts;
  const name = `${sourceUser.username}__test__${crypto.randomBytes(5).toString('hex')}`;

  const testUser = {
    username: name,
    fullName: sourceUser.full_name,
    email: `${name}@example.com`,
    password: crypto.randomBytes(15).toString('hex'),
    roles: sourceUser.roles,
    metadata: {
      isTestUser: true,
      cloneOf: sourceUser.username,
      expiresAt: addMinutes(new Date(), lifespan ?? defaultLifespan),
    },
  };

  await esUsers.createUser(testUser);

  return testUser;
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

async function startCron() {
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
  createTestUser,
  getAll,
  getManyByUsername,
  isTestUser,
  isCloneOf,
  isExpired,
  startCron,
};
