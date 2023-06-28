/**
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param {Repository} repository
 * @param {string} modifier
 */
module.exports.generateRoleNameFromRepository = (repository, modifier) => `repository.${repository.pattern}.${repository.type}.${modifier}.${repository.id}`;
