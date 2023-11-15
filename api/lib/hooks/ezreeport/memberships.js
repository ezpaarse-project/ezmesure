// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const ezrMemberships = require('../../services/ezreeport/memberships');

/**
 * @typedef {import('@prisma/client').Membership} Membership
 */

/**
* @param {Membership} membership
*/
const onMembershipDelete = async (membership) => {
  const { username, institutionId } = membership;

  try {
    await ezrMemberships.deleteFromMembership(membership);
    appLogger.verbose(`[ezreeport][hooks] Membership between user [${username}] and institution [${institutionId}] is deleted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Membership between user [${username}] and institution [${institutionId}] cannot be deleted:\n${error}`);
  }
};

/**
 * @param {Membership} membership
*/
const onMembershipUpsert = async (membership) => {
  const { username, institutionId, permissions } = membership;

  if (!permissions.some((p) => /^reporting:/.test(p))) {
    return onMembershipDelete(membership);
  }

  try {
    await ezrMemberships.upsertFromMembership(membership);
    appLogger.verbose(`[ezreeport][hooks] Membership between user [${username}] and institution [${institutionId}] is upserted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Membership between user [${username}] and institution [${institutionId}] cannot be upserted:\n${error}`);
  }
};

registerHook('membership:create', onMembershipUpsert);
registerHook('membership:update', onMembershipUpsert);
registerHook('membership:upsert', onMembershipUpsert);
registerHook('membership:delete', onMembershipDelete);

module.exports = {
  onMembershipUpsert,
  onMembershipDelete,
};
