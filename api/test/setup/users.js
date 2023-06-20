const config = require('config');
const jwt = require('jsonwebtoken');
const { addHours } = require('date-fns');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');

const ezmesure = require('./ezmesure');
const { getAdminToken } = require('./login');

async function createUserAsAdmin(username, email, fullName, isAdmin) {
  let res;

  // TODO use node config
  const token = await getAdminToken();

  try {
    res = await ezmesure({
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
    console.error(err?.response?.data);
    return;
  }
  return res?.status;
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
        username,
      },
    });
  } catch (err) {
    console.error(err?.response?.data);
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
    console.error(err?.response?.data);
    return;
  }
  return res?.status;
}

module.exports = {
  createUserAsAdmin,
  activateUser,
  deleteUserAsAdmin,
};
