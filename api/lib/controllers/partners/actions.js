const institutionService = require('../../entities/institutions.service');

const ezrAxios = require('../../services/ezreeport/axios');
const { appLogger } = require('../../services/logger');

/**
 * Checks if institution is using ezREEPORT
 *
 * @param {string} institution Institution id
 *
 * @returns Is the institution have an enabled report in ezREEPORT
 */
const isInstitutionHaveReport = async (institution) => {
  let found = false;

  try {
    const { data } = await ezrAxios.get(`/admin/namespaces/${institution}`);
    // eslint-disable-next-line no-restricted-syntax
    for (const task of (data.content?.tasks ?? [])) {
      if (task.enabled) {
        found = true;
        break;
      }
    }
  } catch (error) {
    appLogger.warn(`Couldn't get reports of [${institution}]: ${error}`);
  }

  return found;
};

exports.list = async (ctx) => {
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
        servicesEnabled.ezreeport = await isInstitutionHaveReport(i.id);

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
          servicesEnabled,
          contacts,
        };
      },
    ),
  );
};
