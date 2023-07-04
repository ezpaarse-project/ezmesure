// @ts-check
const elastic = require('.');

/**
 * Upsert role in elastic.
 *
 * @param {String} name - Name of Role.
 * @param {Array<string>} indices - Array of indices.
 * @param {Array<string>} privileges - Rights on indices.
 * @returns {Promise<Object>}
 */
exports.upsertRole = async function upsertRole(name, indices, privileges) {
  return elastic.security.putRole({
    name,
    body: {
      cluster: [],
      indices: [
        {
          names: indices,
          privileges,
        },
      ],
    },
  });
};

/**
 * Delete role in elastic.
 *
 * @param {String} name - Name of Role.
 * @returns {Promise<Object>}
 */
exports.deleteRole = async function deleteRole(name) {
  return elastic.security.deleteRole({ name });
};
