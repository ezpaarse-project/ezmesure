const config = require('config');
const recipients = config.get('notifications.recipients');
const { sendMail, generateMail } = require('../../services/mail');

exports.contact = async function (ctx) {
  const { body } = ctx.request;

  try {
    await sendMail({
      from: body.email,
      to: recipients,
      subject: `Contact - ${body.object}`,
      ...generateMail('contact', { body, appName: config.get('appName') }),
    });

    ctx.status = 200;
  } catch (e) {
    ctx.status = 500;
  }
};