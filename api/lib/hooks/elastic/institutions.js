// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { client: prisma } = require('../../services/prisma');
const { syncUser } = require('../../services/sync/elastic/users');
const { syncApiKey } = require('../../services/sync/elastic/api-keys');

/**
 * @typedef {import('../../.prisma/client.mjs').Institution} Institution
 * @typedef {import('../../.prisma/client.mjs').ElasticRole} ElasticRole
 */

/**
 * @param {{ institution: Institution, role: ElasticRole }} param0
 */
const onInstitutionRoleUpdate = async ({ institution }) => {
  const memberships = await prisma.membership.findMany({
    where: { institutionId: institution.id },
    select: { user: true },
  });

  try {
    await Promise.all(memberships.map((m) => syncUser(m.user)));
  } catch (error) {
    appLogger.error(`[elastic][hooks] Members of [${institution.id}] cannot be sync: ${error.message}`);
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { institutionId: institution.id },
  });

  try {
    await Promise.all(apiKeys.map((apiKey) => syncApiKey(apiKey)));
  } catch (error) {
    appLogger.error(`[elastic][hooks] API keys of [${institution.id}] cannot be sync: ${error.message}`);
  }
};

const hookOptions = { uniqueResolver: (institution) => institution.id };

registerHook('institution:connect:elastic_role', onInstitutionRoleUpdate, hookOptions);
registerHook('institution:disconnect:elastic_role', onInstitutionRoleUpdate, hookOptions);
