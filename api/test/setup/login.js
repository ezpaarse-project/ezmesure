const config = require('config');
const jwt = require('jsonwebtoken');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');

const ezmesure = require('./ezmesure');

const usernameAdmin = config.get('admin.username');
const passwordAdmin = config.get('admin.password');

async function getToken(username, password) {
  let res;

  try {
    res = await ezmesure({
      method: 'POST',
      url: '/login/local',
      data: {
        username,
        password,
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
    return;
  }

  let token = res?.headers['set-cookie'][0];
  const match = /^eztoken=([a-zA-Z0-9_.-]+);/i.exec(token);
  [, token] = match;
  return token;
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
