// @ts-check
const { CronJob } = require('cron');
const config = require('config');
const { isAfter, isValid, startOfDay } = require('date-fns');

const { appLogger } = require('../logger');

const UsersService = require('../../entities/users.service');

/**
 * @typedef {import('../../.prisma/client.mts').User} User
 */

const clean = config.get('users.clean');

async function deleteMarkedUsers() {
  // Removing 1ms to include the users that should be deleted on the same day
  const date = startOfDay(new Date()).getTime() - 1;

  appLogger.verbose('[users] Checking for users to delete...');

  /** @type {User[]} */
  const deletedUsers = await UsersService.$transaction(async (users) => {
    const usersToDelete = await users.findMany({
      where: { deletedAt: { not: null } },
    });

    /** @type {(Promise<User | Error> | undefined)[]} */
    const promises = usersToDelete.map((user) => {
      const hasExpired = user.deletedAt && isValid(user.deletedAt)
        ? isAfter(startOfDay(user.deletedAt), date)
        : undefined;

      if (hasExpired) {
        return undefined;
      }

      return users.delete({ where: { username: user.username } })
        .catch((err) => {
          appLogger.error(`[test-users] Failed to delete user [${user.username}]`, err);
          return err;
        });
    });

    const results = await Promise.all(promises);

    return results.filter(
      /** @type {(res: User | Error | undefined) => res is User} */
      (res) => !!res && !(res instanceof Error),
    );
  });

  appLogger.verbose(`[users] Deleted ${deletedUsers.length} users`);
}

async function startDeletionCron() {
  const job = CronJob.from({
    cronTime: clean.schedule,
    runOnInit: true,
    onTick: async () => {
      await deleteMarkedUsers();
    },
  });

  job.start();
}

module.exports = {
  startDeletionCron,
};
