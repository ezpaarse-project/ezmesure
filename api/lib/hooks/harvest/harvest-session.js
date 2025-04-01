// @ts-check
const config = require('config');

const { registerHook } = require('../hookEmitter');

const { appLogger } = require('../../services/logger');
const { sendMail, generateMail } = require('../../services/mail');

const { client: prisma } = require('../../services/prisma');

const sender = config.get('notifications.sender');
const recipients = config.get('notifications.recipients');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').HarvestSession} HarvestSession
*/
/* eslint-enable max-len */

/**
 * @param {HarvestSession} session
 */
const onHarvestSessionEnd = async (session) => {
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
      memberships: {
        where: {
          roles: { hasSome: ['contact:doc', 'contact:tech'] },
        },
        include: {
          user: true,
        },
      },
      spaces: {
        where: {
          type: 'counter5',
        },
      },
    },
  });

  try {
    await Promise.all(
      institutions.map(async (institution) => {
        const contacts = institution.memberships.map((m) => m.user.email);

        const data = {
          periodStart: session.beginDate,
          periodEnd: session.endDate,
          institution: institution.name,
          space: institution.spaces.at(0)?.id,
          recipients,
        };

        await sendMail({
          from: sender,
          to: contacts,
          cc: recipients,
          replyTo: recipients,
          subject: `Des nouvelles données COUNTER pour "${institution.name}" ont été moissonnées !`,
          ...generateMail('harvest-end', data),
        });
        appLogger.verbose(`[harvest-session][hooks] Mail sent to ${contacts.join(', ')} for ${institution.name}`);
      }),
    );
  } catch (error) {
    appLogger.error(`[harvest-session][hooks] Error while sending mail: ${error}`);
  }
};

// Using debounce here to avoid sending multiple mails
registerHook('harvest-session:end', onHarvestSessionEnd, { debounce: true });
