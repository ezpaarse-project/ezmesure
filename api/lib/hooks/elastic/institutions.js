// @ts-check
const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { client: prisma } = require('../../services/prisma');
const { syncUser } = require('../../services/sync/elastic/users');

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
    include: { user: true },
  });

  try {
    await Promise.all(memberships.map((m) => syncUser(m.user)));
  } catch (error) {
    appLogger.error(`[elastic][hooks] Members of [${institution.id}] cannot be sync: ${error.message}`);
  }
};

const hookOptions = { uniqueResolver: (institution) => institution.id };

registerHook('institution:connect:elastic_role', onInstitutionRoleUpdate, hookOptions);
registerHook('institution:disconnect:elastic_role', onInstitutionRoleUpdate, hookOptions);
