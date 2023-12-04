const config = require('config');
const jwt = require('jsonwebtoken');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');

const usersService = require('../../lib/entities/users.service');

const usernameAdmin = config.get('admin.username');
const passwordAdmin = config.get('admin.password');

async function getToken(username) {
  return usersService.generateToken(username);
}

async function getAdminToken() {
  return getToken(usernameAdmin, passwordAdmin);
}

async function getUserTokenForActivate(username) {
  const currentDate = new Date();
  const expiresAt = addHours(currentDate, passwordResetValidity);

  return jwt.sign({
    username,
    createdAt: currentDate,
    expiresAt,
  }, secret);
}

module.exports = {
  getToken,
  getAdminToken,
  getUserTokenForActivate,
};
