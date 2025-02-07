const { addDays, isAfter } = require('date-fns');
const config = require('config');
const InstitutionService = require('../../entities/institutions.service');

const ezrAxios = require('../../services/ezreeport/axios');
const { appLogger } = require('../../services/logger');

const { username } = config.get('admin');
let reportingAdminToken;

/**
 * key is institution id, value is if a reporting was
 * @type {Map<string, { value: boolean, date: Date }>}
 */
const reportingCache = new Map();

const getTokenOfAdmin = async () => {
  if (!reportingAdminToken) {
    const { data: { content: adminUser } } = await ezrAxios.get(`/admin/users/${username}`);
    reportingAdminToken = adminUser.token;
  }
  return reportingAdminToken;
};

/**
 * Checks if institution is using ezREEPORT
 *
 * @param {string} institutionId Institution id
 *
 * @returns Is the institution have an enabled report in ezREEPORT
 */
const institutionHasReport = async (institutionId) => {
  const now = new Date();
  const cacheEntry = reportingCache.get(institutionId);
  if (cacheEntry && isAfter(addDays(cacheEntry.date, 1), now)) {
    return cacheEntry.value;
  }

  let found = false;

  try {
    const { data: { content } } = await ezrAxios.get('/tasks', {
      params: { namespaceId: institutionId, enabled: true },
      headers: { Authorization: `Bearer ${await getTokenOfAdmin()}` },
    });
    found = content.length > 0;
  } catch (error) {
    appLogger.warn(`Couldn't get reports of [${institutionId}]: ${error}`);
  }

  reportingCache.set(institutionId, { value: found, date: now });
  return found;
};

exports.list = async (ctx) => {
  const institutionService = new InstitutionService();
  const partners = await institutionService.findMany({
    where: {
      validated: true,
      hidePartner: false,
    },
    include: {
      memberships: {
        // search for doc/tech contacts
        where: {
          roles: {
            hasSome: ['contact:doc', 'contact:tech'],
          },
        },
        include: {
          user: true,
        },
      },
      spaces: true,
    },
  });

  ctx.type = 'json';
  ctx.body = await Promise.all(
    partners.map(
      async (i) => {
        const servicesEnabled = {
          ezpaarse: false,
          ezcounter: false,
          ezreeport: false,
        };

        // search for ezpaarse & counter5 spaces
        // eslint-disable-next-line no-restricted-syntax
        for (const { type } of i.spaces) {
          if (servicesEnabled.ezcounter && servicesEnabled.ezpaarse) {
            break;
          }

          servicesEnabled.ezpaarse = servicesEnabled.ezpaarse || type === 'ezpaarse';
          servicesEnabled.ezcounter = servicesEnabled.ezcounter || type === 'counter5';
        }

        // search for enabled ezreeport
        servicesEnabled.ezreeport = await institutionHasReport(i.id);

        // mapping contacts
        const contacts = i.memberships.map(
          (m) => ({
            fullName: m.user.fullName,
            roles: m.roles,
          }),
        );

        return {
          name: i.name,
          acronym: i.acronym,
          social: i.social,
          logoId: i.logoId,
          servicesEnabled,
          contacts,
        };
      },
    ),
  );
};
