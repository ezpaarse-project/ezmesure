const config = require('config');
const elastic = require('.');
const { randomString } = require('../../controllers/auth/password');

/**
 * Create user admin in elastic.
 * Used at the start of the server.
 *
 * @return {Promise<Object>} Admin created.
 */
exports.createAdmin = async function createAdmin() {
  const username = config.get('admin.username');
  const password = config.get('admin.password');
  const email = config.get('admin.email');
  const fullName = 'ezMESURE Administrator';

  return elastic.security.putUser({
    username,
    refresh: true,
    body: {
      password,
      email,
      full_name: fullName,
      roles: ['superuser'],
    },
  });
};

/**
 * Get user with his username in elastic.
 *
 * @param {string} username - Username of user.
 *
 * @return {Promise<Object>} Created user.
 */
exports.getUser = async function getUser(username) {
  return elastic.security.findUser({ username });
};

/**
 * Create user in elastic.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user.
 * @param {string} user.email - Email of user.
 * @param {string} user.fullName - Fullname of user.
 * @param {string} user.roles - Roles of user.hould generate password
 *
 * @return {Promise<Object>} Created user.
 */
exports.createUser = async function createUser(user) {
  const password = await randomString();

  return elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      roles: user.roles || [],
      password,
    },
  });
};

/**
 * Create or update user in elastic.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user.
 * @param {string} user.email - Email of user.
 * @param {string} user.fullName - Fullname of user.
 * @param {Array} user.roles - Roles of user.hould generate password
 *
 * @return {Promise<Object>} Created user.
 */
exports.upsertUser = async function upsertUser(user) {
  let { password = undefined } = user;

  if (!password) {
    password = await randomString();
  }

  return elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      roles: user.roles || [],
      password,
    },
  });
};

/**
 * Update user in elastic.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user.
 * @param {string} user.email - Email of user.
 * @param {string} user.fullName - Fullname of user.
 *
 * @return {Promise<Object>} Updated user.
 */
exports.updateUser = function updateUser(user) {
  // TODO manage role
  return elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      roles: [],
    },
  });
};

/**
 * Delete user in elastic.
 *
 * @param {string} username - Username of user.
 * @returns {Promise<Object>} Deleted user.
 */
exports.deleteUser = async function deleteUser(username) {
  const userExist = await this.getUser(username);
  if (!userExist) return;
  return elastic.security.deleteUser({ username });
};

/**
 * Update password of user in elastic
 *
 * @param {*} username - Username of user.
 * @param {*} password - Password of user.
 *
 * @returns {Promise<Object>} Updated user.
 */
exports.updatePassword = function updatePassword(username, password) {
  return elastic.security.changePassword({
    username,
    body: {
      password,
    },
  });
};
