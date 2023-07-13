/* eslint-disable max-len */
const config = require('config');
const jwt = require('jsonwebtoken');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');

const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

const defaultUser = {
  username: 'user.test',
  email: 'user.test@test.fr',
  fullName: 'User test',
  isAdmin: false,
  password: 'changeme',
};

async function createUserAsAdmin(username, email, fullName, isAdmin) {
  const token = await getAdminToken();

  await ezmesure({
    method: 'PUT',
    url: `/users/${username}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      username,
      email,
      fullName,
      isAdmin,
    },
  });
  return defaultUser;
}

async function activateUser(username, password) {
  const currentDate = new Date();
  const expiresAt = addHours(currentDate, passwordResetValidity);
  const token = jwt.sign({
    username,
    createdAt: currentDate,
    expiresAt,
  }, secret);

  return ezmesure({
    method: 'POST',
    url: '/profile/_activate',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      password,
      acceptTerms: true,
    },
  });
}

async function deleteUserAsAdmin(username) {
  const token = await getAdminToken();

  return ezmesure({
    method: 'DELETE',
    url: `/users/${username}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function createActivatedUserAsAdmin(user) {
  const createdUser = await createUserAsAdmin(user.username, user.email, user.fullName, user.isAdmin);
  await activateUser(user.username, user.password);
  return createdUser;
}

async function createDefaultActivatedUserAsAdmin() {
  await createActivatedUserAsAdmin(defaultUser);
  return defaultUser;
}

async function createDefaultUserAsAdmin() {
  await createUserAsAdmin(
    defaultUser.username,
    defaultUser.email,
    defaultUser.fullName,
    defaultUser.isAdmin,
  );
  return defaultUser;
}

module.exports = {
  createUserAsAdmin,
  createDefaultUserAsAdmin,
  activateUser,
  deleteUserAsAdmin,
  createActivatedUserAsAdmin,
  createDefaultActivatedUserAsAdmin,
};
