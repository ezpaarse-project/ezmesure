// @ts-check
const { client: prisma } = require('../../services/prisma');

/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.UserWhereInput} UserWhereInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 */

/**
 * Get Prisma query to fetch users that are concerned by a type of notification
 *
 * @param {string} type - The type of notification
 *
 * @returns The query to get users from Prisma
 */
const getNotificationUserWhere = (type) => ({
  deletedAt: { equals: null },
  NOT: {
    excludeNotifications: { has: type },
  },
});

/**
 * Get list of admin emails concerned by type of notification (or all if not provided)
 *
 * @param {string} [notificationType] - The type of notification
 * @param {string[]} [exclude] - List of emails to exclude from result
 * @param {TransactionClient} [tx] - The Prisma client/transaction
 *
 * @returns {Promise<string[]>} The emails of admins
 */
module.exports.getNotificationRecipients = async (notificationType, exclude = [], tx = prisma) => {
  /** @type {UserWhereInput[]} */
  const where = [{ isAdmin: true }];
  if (notificationType) {
    where.push(getNotificationUserWhere(notificationType));
  }
  if (exclude.length > 0) {
    where.push({ email: { notIn: exclude } });
  }

  const targets = await tx.user.findMany({
    where: { AND: where },
    select: { email: true },
  });

  return targets.map((user) => user.email);
};

/**
 * Get Prisma query to fetch memberships that are concerned by a type of notification
 *
 * @param {string} notificationType - The type of notification
 *
 * @returns The query to get memberships from Prisma
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
