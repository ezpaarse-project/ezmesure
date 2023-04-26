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
 * Create user in elastic with random password.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user
 * @param {string} user.email - Email of user
 * @param {string} user.fullName - Fullname of user
 *
 * @return {Promise<Object>} Created user.
 */
exports.createUser = async function createUser(user) {
  const tmpPassword = await randomString();

  return elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      password: tmpPassword,
      roles: ['new_user'],
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
exports.deleteUser = function deleteUser(username) {
  // TODO check if user exist
  return elastic.security.deleteUser({ username });
};
