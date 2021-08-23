const config = require('config');

const recipients = config.get('notifications.recipients');
const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../../server');

exports.contact = async (ctx) => {
  const { body } = ctx.request;

  ctx.status = 200;

  try {
    ctx.body = await sendMail({
      from: body.email,
      to: recipients,
      subject: `Contact - ${body.object}`,
      ...generateMail('contact', { body, appName: config.get('appName') }),
    });
  } catch (err) {
    appLogger.error('Failed to send mail', err);
    ctx.status = 500;
  }
};
