// @ts-check
const elastic = require('.');

/**
 * Upsert role in elastic.
 *
 * @param {string} name - Name of role.
 * @param {Map<string, { privileges: string[] }>} indices - Map of rights,
 * key is the index value and value are the rights.
 * @returns {Promise<Object>}
 */
exports.upsertRole = async function upsertRole(name, indices) {
  return elastic.security.putRole({
    name,
    body: {
      cluster: [],
      indices: [...indices].map(([index, { privileges }]) => ({
        names: [index],
        privileges,
      })),
    },
  });
};

/**
 * Delete role in elastic.
 *
 * @param {string} name - Name of Role.
 * @returns {Promise<Object>}
 */
exports.deleteRole = async function deleteRole(name) {
  return elastic.security.deleteRole({ name }, { ignore: [404] });
};
