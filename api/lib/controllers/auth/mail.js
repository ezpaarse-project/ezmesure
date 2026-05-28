const { sendMail, generateMail } = require('../../services/mail');

/**
 * Sends an email to the user who has just accepted the terms of use.
 *
 * @param {User} user - User data.
 *
 * @returns {Promise<void>}
 */
exports.sendWelcomeMail = function sendWelcomeMail(user) {
  return sendMail({
    to: user.email,
    ...generateMail('welcome', { user }, { locale: user.language }),
  });
};
