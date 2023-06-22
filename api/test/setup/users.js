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

  try {
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
  } catch (err) {
    return;
  }
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

  let res;
  try {
    res = await ezmesure({
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
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.status;
}

async function deleteUserAsAdmin(username) {
  const token = await getAdminToken();

  let res;

  try {
    res = await ezmesure({
      method: 'DELETE',
      url: `/users/${username}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    res = err?.response;
    return;
  }
  return res?.status;
}

async function createActivatedUserAsAdmin(user) {
  await createUserAsAdmin(user.username, user.email, user.fullName, user.isAdmin);
  await activateUser(user.username, user.password);
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
