const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');
const diffInHours = config.get('passwordResetValidity');

/**
 * Generate a random string.
 *
 * @returns {Promise<string>}
 */
exports.randomString = function randomString() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(5, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('hex'));
      }
    });
  });
};

/**
 * Generates a token for the activation of the user's account.
 *
 * @param {string} origin - Host origin.
 * @param {string} username - Username of the user who needs to activate his account.
 *
 * @returns {string}
 */
exports.activateUserLink = function activateUserLink(origin, username) {
  const currentDate = new Date();
  const expiresAt = addHours(currentDate, passwordResetValidity);
  const token = jwt.sign({
    username,
    createdAt: currentDate,
    expiresAt,
  }, secret);

  return `${origin}/activate?token=${token}`;
};

/**
 * Generates data for the content of the email for password recovery.
 *
 * @param {string} origin - Host origin.
 * @param {string} username - Username of the user who needs to recreate his password.
 *
 * @returns {Object}
 */
exports.mailDataForPasswordRecovery = function mailDataForPasswordRecovery(origin, username) {
  const currentDate = new Date();
  const expiresAt = addHours(currentDate, passwordResetValidity);
  const token = jwt.sign({
    username,
    createdAt: currentDate,
    expiresAt,
  }, secret);

  return {
    recoveryLink: `${origin}/password/new?token=${token}`,
    resetLink: `${origin}/password/reset`,
    validity: `${diffInHours} heure${diffInHours > 1 ? 's' : ''}`,
  };
};
