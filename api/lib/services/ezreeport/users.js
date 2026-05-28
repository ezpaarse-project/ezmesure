// @ts-check
const $fetch = require('./http');

/** @typedef {import('../../.prisma/client.mjs').User} User */

/**
 * Get token of a user from a ezREEPORT
 *
 * @param {string} username The username of the user
 * @returns The token
 */
async function getUserToken(username) {
  const { content } = await $fetch(`/admin/users/${username}`);
  return content?.token;
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
  const { content } = await $fetch(`/admin/users/${user.username}`, {
    method: 'PUT',
    body,
  });

  return content;
}

/**
 * Delete a user in ezREEPORT from an ezMESURE's user
 *
 * @param {User} user
 */
async function deleteUserFromUser(user) {
  await $fetch(`/admin/users/${user.username}`, {
    method: 'DELETE',
  });
}

module.exports = {
  getToken: getUserToken,
  upsertFromUser: upsertUserFromUser,
  deleteFromUser: deleteUserFromUser,
};
