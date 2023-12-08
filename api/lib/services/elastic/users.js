/* eslint-disable no-underscore-dangle */
const config = require('config');
const elastic = require('.');
const { randomString } = require('../../controllers/auth/password');

const adminUsername = config.get('admin.username');

/**
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityUser} ElasticUser
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityPutUserResponse} ElasticUserCreated
 * @typedef {import('@elastic/elasticsearch').estypes.SecurityDeleteUserResponse} ElasticUserDeleted
 */

/**
 * Create user admin in elastic.
 * Used at the start of the server.
 *
 * @return {Promise<ElasticUserCreated>} Admin created.
 */
exports.createAdmin = async function createAdmin() {
  const username = config.get('admin.username');
  const password = config.get('admin.password');
  const email = config.get('admin.email');
  const fullName = config.get('admin.fullName');

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
 * Create user in elastic.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user.
 * @param {string | undefined} user.email - Email of user.
 * @param {string | undefined} user.fullName - Full name of user.
 * @param {string[]} user.roles - Roles of user.
 *
 * @return {Promise<ElasticUserCreated>} Created user.
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
 * Upsert a user.
 *
 * @param {Object} user - The user.
 * @param {string} user.username - Username of user.
 * @param {string | undefined} user.email - Email of user.
 * @param {string | undefined} user.fullName - Fullname of user.
 * @param {string[]} user.roles - Roles of user.
 *
 * @return {Promise<ElasticUserCreated>} Created user.
 */
exports.upsertUser = async function upsertUser(user) {
  let { password } = user;

  const userExist = await exports.getUserByUsername(user.username);
  if (!userExist) {
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
 * Get user in elastic
 *
 * @param {string} username User's username
 *
 * @returns {Promise<ElasticUser | null>} The user found, or null if not
 */
exports.getUserByUsername = async function getUserByUsername(username) {
  try {
    const { body } = await elastic.security.getUser({
      username,
    });
    return body[username];
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Update user in elastic.
 *
 * @param {Object} user - Config of user.
 * @param {string} user.username - Username of user.
 * @param {string | undefined} user.email - Email of user.
 * @param {string | undefined} user.fullName - Fullname of user.
 * @param {string[]} user.roles - Roles of user.
 *
 * @return {Promise<ElasticUserCreated>} Updated user.
 */
exports.updateUser = function updateUser(user) {
  return elastic.security.putUser({
    username: user.username,
    body: {
      email: user.email,
      full_name: user.fullName,
      roles: user.roles || [],
    },
  });
};

/**
 * Update password of user in elastic
 *
 * @param {string} username - Username of user.
 * @param {string} password - Password of user.
 *
 * @returns {Promise<ElasticUser>} Updated user.
 */
exports.updatePassword = function updatePassword(username, password) {
  return elastic.security.changePassword({
    username,
    body: {
      password,
    },
  });
};

/**
 * Delete user in elastic.
 *
 * @param {string} username - Username of user.
 * @returns {Promise<ElasticUserDeleted>} Deleted user.
 */
exports.deleteUser = function deleteUser(username) {
  return elastic.security.deleteUser({ username }, { ignore: [404] });
};

/**
 * delete all indices in elastic.
 *
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
 */
exports.removeAll = async function removeAllUser() {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const res = await elastic.search({
    index: '.security',
    body: {
      query: {
        bool: {
          filter: [
            { term: { type: 'user' } },
          ],
        },
      },
    },
  });

  let users = res.body.hits.hits;

  users = users.filter((user) => user?._source?.username !== adminUsername);
  const usernames = users.map((user) => user?._source?.username);

  await Promise.all(usernames.map(async (username) => {
    elastic.security.deleteUser({ username }, { ignore: [404] });
  }));

  return users;
};
