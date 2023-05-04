const ezrAxios = require('./axios');

/** @typedef {import('@prisma/client').User} User */

/**
 * Get token of a user from a ezREEPORT
 *
 * @param {string} username The username of the user
 * @returns The token
 */
async function getUserToken(username) {
  const { data } = await ezrAxios.get(`/admin/users/${username}`);
  return data?.content?.token;
}

/**
 * Updates (or create) a user in ezREEPORT from an ezMESURE's user
 *
 * @param {User} user
 * @returns The created user
 */
async function upsertUserFromUser(user) {
  const body = {
    isAdmin: user.isAdmin,
  };
  const { data } = await ezrAxios.put(`/admin/users/${user.username}`, body);

  return data?.content;
}

/**
 * Delete a user in ezREEPORT from an ezMESURE's user
 *
 * @param {User} user
 */
async function deleteUserFromUser(user) {
  await ezrAxios.delete(`/admin/users/${user.username}`);
}

module.exports = {
  getToken: getUserToken,
  upsertFromUser: upsertUserFromUser,
  deleteFromUser: deleteUserFromUser,
};
