// @ts-check
const { CronJob } = require('cron');
const config = require('config');

const { subDays } = require('date-fns');

const { getNotificationRecipients } = require('../../utils/notifications');
const { ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

const OutgoingEmailsService = require('../../entities/outgoing-emails.service');

const { appLogger } = require('../logger');
const { sendMail, generateMail } = require('../mail');

/**
 * @typedef {import('../../.prisma/client.mts').User} User
 */

const summaryCron = config.get('emails.summary.schedule');
const cleanupCron = config.get('emails.cleanup.schedule');
const maxDayAge = config.get('emails.cleanup.maxDayAge');

// Email types that should not be included in the summary, since they are directly sent to admins
const emailTypesToIgnore = [
  'outgoing-emails-summary',
  'contact',
  'recent-activity',
  'sushi-ready-change',
];

let lastSummaryDate = new Date();

async function sendEmailsSummaryToAdmins() {
  appLogger.verbose('[emails-summary] Sending a summary of sent emails...');

  const outgoingEmails = await (new OutgoingEmailsService()).findMany({
    where: {
      sentAt: {
        gte: lastSummaryDate,
      },
      OR: [
        { template: null },
        { template: { notIn: emailTypesToIgnore } },
      ],
    },
  });

  if (outgoingEmails.length === 0) {
    appLogger.verbose('[emails-summary] No email to summerize');
    lastSummaryDate = new Date();
    return;
  }

  const admins = await getNotificationRecipients(ADMIN_NOTIFICATION_TYPES.emailsSummary);

  /**
   * @type {{
   *   totalFailed: number,
   *   totalByType: Record<string, number>,
   * }}
   */
  const summary = {
    totalFailed: 0,
    totalByType: {},
  };

  outgoingEmails.forEach((email) => {
    if (email.status === 'failed') {
      summary.totalFailed += 1;
    }

    const template = email.template ?? 'unknown';

    if (summary.totalByType[template]) {
      summary.totalByType[template] += 1;
    } else {
      summary.totalByType[template] = 1;
    }
  }, { totalFailed: 0, totalByType: {} });

  await Promise.all(
    admins.map(async (user) => {
      try {
        await sendMail({
          to: user.email,
          ...generateMail(
            'outgoing-emails-summary',
            {
              emails: outgoingEmails,
              summary,
            },
            {
              locale: user.language ?? undefined,
            },
          ),
        });
      } catch (err) {
        appLogger.error(`[emails-summary] Failed to send mail to [${user.email}]`, err);
      }
    }),
  );

  appLogger.verbose(`[emails-summary] Sent a summary of ${outgoingEmails.length} emails to ${admins.length} admins`);

  lastSummaryDate = new Date();
}

async function cleanupEmails() {
  const limit = subDays(new Date(), maxDayAge);
  appLogger.verbose(`[emails-cleanup] Cleaning up outgoing emails older than ${limit.toISOString()}...`);

  const { count } = await (new OutgoingEmailsService()).deleteMany({
    where: {
      sentAt: {
        lte: limit,
      },
    },
  });

  appLogger.verbose(`[emails-cleanup] Cleaned up ${count} emails`);
}

async function startEmailsSummaryCron() {
  const job = CronJob.from({
    cronTime: summaryCron,
    runOnInit: true,
    onTick: async () => {
      await sendEmailsSummaryToAdmins();
    },
  });

  job.start();
}

async function startEmailsCleanupCron() {
  const job = CronJob.from({
    cronTime: cleanupCron,
    runOnInit: true,
    onTick: async () => {
      await cleanupEmails();
    },
  });

  job.start();
}

module.exports = {
  startEmailsSummaryCron,
  startEmailsCleanupCron,
};
