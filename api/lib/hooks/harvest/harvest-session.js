// @ts-check
const config = require('config');
const { isAfter } = require('date-fns');

const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { sendMail, generateMail } = require('../../services/mail');

const { client: prisma } = require('../../services/prisma');

const { getNotificationRecipients, getNotificationMembershipWhere } = require('../../utils/notifications');
const { NOTIFICATION_TYPES, ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');
/**
 * @typedef {object} SushiConnection
 * @property {number} date
 * @property {string} status
 * @property {import('../../services/sushi').SushiException[]} [exceptions]
 * @property {string} [errorCode]
 */

/**
 * @param {unknown} c
 * @return {c is SushiConnection}
 */
const isConnection = (c) => {
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return false;
  }
  return 'date' in c && 'status' in c;
};

/**
 * @param {HarvestSession} session
 */
async function sendEndMail(session) {
  const institutions = await prisma.institution.findMany({
    where: {
      sushiCredentials: {
        some: {
          harvestJobs: {
            some: {
              sessionId: session.id,
            },
          },
        },
      },
    },
    include: {
      // Get current contacts
      memberships: {
        where: getNotificationMembershipWhere(NOTIFICATION_TYPES.newCounterDataAvailable),
        include: {
          user: true,
        },
      },
      // Get harvested credentials
      sushiCredentials: {
        where: {
          harvestJobs: {
            some: {
              sessionId: session.id,
            },
          },
        },
        include: {
          endpoint: true,
        },
      },
      // Get spaces of institutions
      // TODO: what if contact doesn't have access to space ?
      spaces: {
        where: {
          type: 'counter5',
        },
      },
    },
  });

  const admins = await getNotificationRecipients(ADMIN_NOTIFICATION_TYPES.newCounterDataAvailable);

  try {
    await Promise.all(
      institutions.map(async (institution) => {
        const contacts = new Set(institution.memberships.map((m) => m.user.email));

        // TODO: what if multiple spaces
        const spaceID = institution.spaces.at(0)?.id;
        const publicUrl = new URL(config.get('publicUrl'));

        const data = {
          periodStart: session.beginDate,
          periodEnd: session.endDate,
          institution: institution.name,
          credentials: institution.sushiCredentials
            .map((c) => {
              let status;
              if (isConnection(c.connection)) {
                status = c.connection.status;
              }

              return ({
                endpoint: c.endpoint.vendor,
                packages: c.packages.sort().join(', '),
                expired: status === 'unauthorized',
                createdAt: c.createdAt,
              });
            })
            .sort(
              (a, b) => a.endpoint.localeCompare(b.endpoint)
                || a.packages.localeCompare(b.packages)
                || (isAfter(a.createdAt, b.createdAt) ? 1 : -1),
            ),
          credentialsURL: new URL(`myspace/institutions/${institution.id}/sushi`, publicUrl).href,
          spaceURL: spaceID ? new URL(`kibana/s/${spaceID}`, publicUrl).href : undefined,
        };

        await sendMail({
          to: Array.from(contacts),
          bcc: admins.filter((email) => !contacts.has(email)),
          subject: `Des nouvelles données COUNTER pour "${institution.name}" ont été moissonnées !`,
          ...generateMail('harvest-end', data),
        });
        appLogger.verbose(`[harvest-session][hooks] Mail sent to ${contacts.join(', ')} for ${institution.name}`);
      }),
    );
  } catch (error) {
    appLogger.error(`[harvest-session][hooks] Error while sending mail: ${error}`);
  }
}

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').HarvestSession} HarvestSession
*/
/* eslint-enable max-len */

/**
 * @param {HarvestSession} session
 */
const onHarvestSessionStart = async (session) => {
  try {
    await prisma.harvestSession.update({
      where: { id: session.id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });
  } catch (err) {
    appLogger.error(`[harvest-session][hooks] Error while updating status: ${err}`);
  }
};

/**
 * @param {HarvestSession} session
 */
const onHarvestSessionStop = async (session) => {
  try {
    await prisma.harvestSession.update({
      where: { id: session.id },
      data: { status: 'stopped' },
    });
  } catch (err) {
    appLogger.error(`[harvest-session][hooks] Error while updating status: ${err}`);
  }
};

/**
 * @param {HarvestSession} session
 */
const onHarvestSessionEnd = async (session) => {
  try {
    await prisma.harvestSession.update({
      where: { id: session.id },
      data: { status: 'finished' },
    });
  } catch (err) {
    appLogger.error(`[harvest-session][hooks] Error while updating status: ${err}`);
  }

  if (session.sendEndMail) {
    await sendEndMail(session);
  }
};

registerHook('harvest-session:start', onHarvestSessionStart);
registerHook('harvest-session:stop', onHarvestSessionStop);
// Using debounce here to avoid triggering session end multiple times
registerHook('harvest-session:end', onHarvestSessionEnd, { debounce: true });
