const { appName } = require('config');

const { sendMail, generateMail } = require('../../services/mail');
const { getNotificationRecipients } = require('../../services/notifications');
const { appLogger } = require('../../services/logger');

const { NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

exports.contact = async (ctx) => {
  const { body } = ctx.request;

  ctx.status = 200;

  try {
    const admins = await getNotificationRecipients(NOTIFICATION_TYPES.contactForm);

    ctx.body = await sendMail({
      from: body.email,
      to: admins,
      subject: `Contact - ${body.subject}`,
      ...generateMail('contact', { body, appName }),
    });
  } catch (err) {
    appLogger.error(`Failed to send mail: ${err}`);
    ctx.status = 500;
  }
};
