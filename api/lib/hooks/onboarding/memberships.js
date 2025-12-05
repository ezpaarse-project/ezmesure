// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { client: prisma } = require('../../services/prisma');

/**
 * @typedef {import('../../.prisma/client.mjs').User} User
 * @typedef {import('../../.prisma/client.mjs').Membership} Membership
 */

/**
 * Remove all onboarding memberships if user is added to institution
 *
 * @param {Membership} membership - The membership that was created
 */
const onMembershipUpsert = async (membership) => {
  try {
    // If we're upserting the membership of a onboarding institution, don't do anything
    const institution = await prisma.institution.findUniqueOrThrow({
      where: { id: membership.institutionId },
    });
    if (institution.onboarding) {
      return;
    }

    // Using prisma instead of service to avoid loops between hooks
    await prisma.membership.deleteMany({
      where: {
        username: membership.username,
        institution: { onboarding: true },
      },
    });

    appLogger.verbose(`[onboarding][hooks] User [${membership.username}] have been removed from onboarding`);
  } catch (error) {
    appLogger.error(`[onboarding][hooks] User [${membership.username}] could not be removed from onboarding:\n${error}`);
  }
};

registerHook('membership:create', onMembershipUpsert);
registerHook('membership:upsert', onMembershipUpsert);
