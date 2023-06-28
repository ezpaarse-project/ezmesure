/**
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param {Space} space
 * @param {string} modifier
 */
module.exports.generateRoleNameFromSpace = (space, modifier) => `space.${space.id}.${space.type}.${modifier}`;

/**
 * @param {Repository} repository
 * @param {string} modifier
 */
module.exports.generateRoleNameFromRepository = (repository, modifier) => `repository.${repository.pattern}.${repository.type}.${modifier}.${repository.id}`;
