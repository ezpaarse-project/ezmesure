const config = require('config');
const elastic = require('.');
const { randomString } = require('../../controllers/auth/password');

/**
 * Create user admin in elastic.
 * Used at the start of the server.
 */
exports.createAdmin = async function createAdmin() {
  const username = config.get('admin.username');
  const password = config.get('admin.password');
  const email = config.get('admin.email');
  const fullName = 'ezMESURE Administrator';

  await elastic.security.putUser({
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
 */
exports.createUser = async function createUser(user) {
  const tmpPassword = await randomString();

  await elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      password: tmpPassword,
      roles: ['new_user'],
    },
  });
};
