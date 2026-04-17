const { appName } = require('config');

const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');

const { getNotificationRecipients } = require('../../utils/notifications');
const { ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

exports.contact = async (ctx) => {
  const { body } = ctx.request;

  ctx.status = 200;

  const admins = await getNotificationRecipients(ADMIN_NOTIFICATION_TYPES.contactForm);

  const results = await Promise.allSettled(
    admins.map(async (admin) => {
      try {
        await sendMail({
          from: body.email,
          to: admin.email,
          ...generateMail('contact', { body, appName }, { locale: admin.language }),
        });

        appLogger.verbose(`[contact] Mail sent to ${admin.email}`);
      } catch (err) {
        appLogger.error(`[contact] Failed to send mail to ${admin.email}: ${err}`);
        throw err;
      }
    }),
  );

  const succeeded = results.filter((result) => result.status === 'fulfilled');
  const failed = results.filter((result) => result.status === 'rejected');

  ctx.status = succeeded.length === 0 ? 500 : 200;

  ctx.body = {
    errors: failed.length > 0,
    adminsNotified: succeeded.length,
    adminsFailed: failed.length,
  };
};
