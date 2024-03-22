const config = require('config');

const sender = config.get('notifications.sender');
const supports = config.get('notifications.supportRecipients');
const { sendMail, generateMail } = require('../../services/mail');

/**
 * Sends an email to a newly created user where there is a link to create his password
 * and accept the terms of use.
 *
 * @param {Object} user - User data.
 * @param {string} user.username - Username of user.
 * @param {string} user.email - User email.
 * @param {Object} data - Mail config.
 * @param {string} data.recoveryLink - Recovery password link.
 * @param {string} data.resetLink - Reset recovery password link.
 * @param {string} data.validity - Duration of Recovery link.
 *
 * @returns {Promise<void>}
 */
exports.sendActivateUserMail = function sendActivateUserMail(user, activateLink) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Bienvenue sur ezMESURE !',
    ...generateMail('activate-user', { username: user.username, activateLink }),
  });
};

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

/**
 * Sends an email to the user who has just requested to change his password.
 *
 * @param {Object} user - User data.
 * @param {string} user.username - Username of user.
 * @param {Object} data - Mail config.
 * @param {string} data.recoveryLink - Recovery password link.
 * @param {string} data.resetLink - Reset recovery password link.
 * @param {string} data.validity - Duration of Recovery link.
 *
 * @returns {Promise<void>}
 */
exports.sendPasswordRecovery = function sendPasswordRecovery(user, data) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Réinitialisation mot de passe ezMESURE/Kibana',
    ...generateMail('new-password', { user, ...data }),
  });
};

/**
 * Sends an email to the contacts of the user who has just activated his account according
 * to the domain name of the user's email.
 *
 * @param {Array<string>} receivers - Emails of contacts.
 * @param {Object} data - Mail config.
 * @param {string} data.newUser - Username of user who activated his account.
 *
 * @returns {Promise<void>}
 */
exports.sendNewUserToContacts = function sendNewUserToContacts(receivers, data) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supports,
    subject: `${data.newUser} s'est inscrit sur ezMESURE`,
    ...generateMail('new-account', { data }),
  });
};
