// @ts-check
const UserService = require('../../entities/users.service');

/**
 * Get list of admin emails concerned by type of notification (or all if not provided)
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

/**
 * Get prisma query to fetch memberships that are concerned by a type of notification
 *
 * @param {string} [type] - The type of notification
 *
 * @returns The query to get memberships from prisma
 */
module.exports.getNotificationMembershipWhere = (type) => ({
  roles: {
    some: {
      role: {
        notifications: { has: type },
      },
    },
  },
  user: {
    NOT: {
      excludeNotifications: { has: type },
    },
  },
});
