const config = require('config');

const sender = config.get('notifications.sender');
const { sendMail, generateMail } = require('../../services/mail');

/**
 * Sends an email to the user who has just accepted the terms of use.
 *
 * @param {Object} user - User data.
 * @param {string} user.username - Username of user.
 * @param {string} user.email - User email.
 *
 * @returns {Promise<void>}
 */
exports.sendWelcomeMail = function sendWelcomeMail(user) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Bienvenue sur ezMESURE !',
    ...generateMail('welcome', { username: user.username }),
  });
};
