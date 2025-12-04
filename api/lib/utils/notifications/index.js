// @ts-check
const UserService = require('../../entities/users.service');

/**
 * Return list of admin emails concerned by type of notification (or all if not provided)
 *
 * @param {string} [type] - The type of notification
 *
 * @returns {Promise<string[]>} The emails of admins
 */
module.exports.getNotificationRecipients = async (type) => {
  const users = new UserService();

  const targets = await users.findMany({
    where: {
      isAdmin: true,
      NOT: {
        excludeNotifications: { has: type },
      },
    },
    select: { email: true },
  });

  return targets.map((user) => user.email);
};
