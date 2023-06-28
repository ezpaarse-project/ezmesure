// @ts-check
const hookEmitter = require('./_hookEmitter');

const { appLogger } = require('../services/logger');

const { client: prisma } = require('../services/prisma.service');

const ezrUsers = require('../services/ezreeport/users');
const ezrReportingUsers = require('../services/ezreeport/reportingUsers');
const ezrNamespaces = require('../services/ezreeport/namespaces');
const ezrMemberships = require('../services/ezreeport/memberships');

/**
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 * @typedef {import('@prisma/client').Membership} Membership
 */

// #region Users

/**
 * @param {User} user
 */
const onUserDelete = async (user) => {
  try {
    await ezrUsers.deleteFromUser(user);
    appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is deleted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] User [${user.username}] cannot be deleted:\n${error}`);
  }
};

/**
 * @param {User} user
 */
const onUserUpsert = async (user) => {
  try {
    await ezrUsers.upsertFromUser(user);
    appLogger.verbose(`[ezreeport][hooks] User [${user.username}] is upserted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] User [${user.username}] cannot be upserted:\n${error}`);
  }
};

hookEmitter.on('user:create-admin', onUserUpsert);
hookEmitter.on('user:create', onUserUpsert);
hookEmitter.on('user:update', onUserUpsert);
hookEmitter.on('user:upsert', onUserUpsert);
hookEmitter.on('user:delete', onUserDelete);

// #endregion Users

// #region Memberships

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

hookEmitter.on('membership:create', onMembershipUpsert);
hookEmitter.on('membership:update', onMembershipUpsert);
hookEmitter.on('membership:upsert', onMembershipUpsert);
hookEmitter.on('membership:delete', onMembershipDelete);

// #endregion Memberships

// #region Institutions

/**
 * @param {Institution} institution
 */
const onInstitutionDelete = async (institution) => {
  try {
    await ezrNamespaces.deleteFromInstitution(institution);
    appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] is deleted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Namespace [${institution.id}] cannot be deleted:\n${error}`);
  }

  // Delete reporting user
  let username;
  try {
    username = (await ezrReportingUsers.deleteReportUserFromInstitution(institution)).username;
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is deleted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be deleted in elastic:\n${error}`);
  }
};

/**
 * @param {Institution} institution
 */
const onInstitutionUpsert = async (institution) => {
  if (!institution.validated) {
    // Using event of THIS event handler (not the whole bus)
    return onInstitutionDelete(institution);
  }

  let created = false;
  try {
    await ezrNamespaces.upsertFromInstitution(institution);
    created = true;
    appLogger.verbose(`[ezreeport][hooks] Namespace [${institution.id}] is upserted`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Namespace [${institution.id}] cannot be upserted:\n${error}`);
  }

  // Upsert reporting user
  let username;
  try {
    username = (await ezrReportingUsers.upsertReportUserFromInstitution(institution)).username;
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
  }

  if (!created) {
    return;
  }

  try {
    const memberships = await prisma.membership.findMany({
      where: { institutionId: institution.id },
    });
    await Promise.all(
      memberships.map((membership) => onMembershipUpsert(membership)),
    );
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Memberships of [${institution.id}] cannot be upserted:\n${error}`);
  }
};

hookEmitter.on('institution:create', onInstitutionUpsert);
hookEmitter.on('institution:update', onInstitutionUpsert);
hookEmitter.on('institution:upsert', onInstitutionUpsert);
hookEmitter.on('institution:delete', onInstitutionDelete);

// #endregion Institutions

module.exports = hookEmitter;
