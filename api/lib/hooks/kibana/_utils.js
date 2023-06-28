/**
 * @typedef {import('@prisma/client').Space} Space
 */

/**
 * @param {Space} space
 * @param {string} modifier
 */
module.exports.generateRoleNameFromSpace = (space, modifier) => `space.${space.id}.${space.type}.${modifier}`;
