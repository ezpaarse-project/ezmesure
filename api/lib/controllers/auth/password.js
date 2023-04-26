const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');
const diffInHours = config.get('passwordResetValidity');

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
