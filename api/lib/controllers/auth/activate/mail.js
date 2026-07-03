const { sendMail, generateMail } = require('../../../services/mail');

/**
 * @typedef {import('../../entities/users.service').User} User
 */

/**
 * Sends an email to a newly created user where there is a link to create his password
 * and accept the terms of use.
 *
 * @param {User} user - User data.
 * @param {Object} data - Mail config.
 * @param {string} data.recoveryLink - Recovery password link.
 * @param {string} data.resetLink - Reset recovery password link.
 * @param {string} data.validity - Duration of Recovery link.
 *
 * @returns {Promise<void>}
 */
exports.sendActivateUserMail = (user, activateLink) => sendMail({
  to: user.email,
  subject: 'Bienvenue sur ezMESURE !',
  ...generateMail('activate-user', { user, activateLink }, { locale: user.language }),
});

/**
 * Sends an email to a contact of the user who has just activated his account according
 * to the domain name of the user's email.
 *
 * @param {User} user - The contact to notify.
 * @param {Object} data - Mail config.
 * @param {User} data.newUser - The user who activated his account.
 *
 * @returns {Promise<void>}
 */
exports.sendNewUserToContact = (user, data) => sendMail({
  to: user.email,
  ...generateMail('new-account', { user, ...data }, { locale: user.language }),
});
