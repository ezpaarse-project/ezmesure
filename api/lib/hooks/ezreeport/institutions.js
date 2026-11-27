// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');

const { client: prisma } = require('../../services/prisma');

const ezrReportingUsers = require('../../services/ezreeport/reportingUsers');
const ezrNamespaces = require('../../services/ezreeport/namespaces');

const { onMembershipUpsert } = require('./memberships');

/**
 * @typedef {import('../../.prisma/client.mjs').Institution} Institution
 * @typedef {import('../../.prisma/client.mjs').ElasticRole} ElasticRole
 */

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
    ({ username } = await ezrReportingUsers.upsertReportUserFromInstitutionId(institution?.id));
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

/**
 * @param {{ role: ElasticRole, institution: Institution }} param0
 */
const onInstitutionRoleUpdate = async ({ institution }) => {
  // Upsert reporting user
  let username;
  try {
    ({ username } = await ezrReportingUsers.upsertReportUserFromInstitutionId(institution.id));
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
  }
};

const hookOptions = { uniqueResolver: (institution) => institution.id };

registerHook('institution:create', onInstitutionUpsert, hookOptions);
registerHook('institution:update', onInstitutionUpsert, hookOptions);
registerHook('institution:upsert', onInstitutionUpsert, hookOptions);
registerHook('institution:delete', onInstitutionDelete, hookOptions);

registerHook('institution:connect:elastic_role', onInstitutionRoleUpdate, hookOptions);
registerHook('institution:disconnect:elastic_role', onInstitutionRoleUpdate, hookOptions);
