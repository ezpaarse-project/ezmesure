// @ts-check
const { client: prisma } = require('../../services/prisma');

/** @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient */

/**
 * Get prisma query to fetch users that are concerned by a type of notification
 *
 * @param {string} type - The type of notification
 *
 * @returns The query to get users from prisma
 */
const getNotificationUserWhere = (type) => ({
  NOT: {
    excludeNotifications: { has: type },
  },
});

/**
 * Get list of admin emails concerned by type of notification (or all if not provided)
 *
 * @param {string} [notificationType] - The type of notification
 * @param {TransactionClient} [tx]
 *
 * @returns {Promise<string[]>} The emails of admins
 */
module.exports.getNotificationRecipients = async (notificationType, tx = prisma) => {
  const targets = await tx.user.findMany({
    where: {
      isAdmin: true,
      ...(notificationType ? getNotificationUserWhere(notificationType) : {}),
    },
    select: { email: true },
  });

  return targets.map((user) => user.email);
};

/**
 * Get prisma query to fetch memberships that are concerned by a type of notification
 *
 * @param {string} notificationType - The type of notification
 *
 * @returns The query to get memberships from prisma
 */
module.exports.getNotificationMembershipWhere = (notificationType) => ({
  roles: {
    some: {
      role: {
        notifications: { has: notificationType },
      },
    },
  },
  user: getNotificationUserWhere(notificationType),
});
