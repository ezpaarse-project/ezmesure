// @ts-check
const { CronJob } = require('cron');
const config = require('config');
const { isAfter, isValid, startOfDay } = require('date-fns');

const { getNotificationRecipients } = require('../../utils/notifications');
const { ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

const UsersService = require('../../entities/users.service');

const { appLogger } = require('../logger');
const { sendMail, generateMail } = require('../mail');

/**
 * @typedef {import('../../.prisma/client.mts').User} User
 */

const clean = config.get('users.clean');

async function deleteMarkedUsers() {
  // Removing 1ms to include the users that should be deleted on the same day
  const date = startOfDay(new Date()).getTime() - 1;

  appLogger.verbose('[user-deletion] Checking for users to delete...');

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
          appLogger.error(`[user-deletion] Failed to delete user [${user.username}]`, err);
          return err;
        });
    });

    const results = await Promise.all(promises);

    return results.filter(
      /** @type {(res: User | Error | undefined) => res is User} */
      (res) => !!res && !(res instanceof Error),
    );
  });

  appLogger.verbose(`[user-deletion] Deleted ${deletedUsers.length} users`);

  const admins = await getNotificationRecipients(
    ADMIN_NOTIFICATION_TYPES.userDeleted,
    // No need to exclude as users are deleted
  );

  await Promise.all(
    deletedUsers.map(async (user) => {
      try {
        await sendMail({
          to: user.email,
          bcc: admins,
          subject: 'La suppression de votre compte est maintenant effective',
          ...generateMail('user-deleted'),
        });
      } catch (err) {
        appLogger.error(`[user-deletion] Failed to send mail to [${user.email}]`, err);
      }
    }),
  );
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
