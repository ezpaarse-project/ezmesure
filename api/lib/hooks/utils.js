const { client: prisma } = require('../services/prisma.service');

/**
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param {Space} space
 * @param {string} modifier
 */
const generateRoleNameFromSpace = (space, modifier) => `space.${space.id}.${space.type}.${modifier}`;

/**
 * @param {Repository} repository
 * @param {string} modifier
 */
const generateRoleNameFromRepository = (repository, modifier) => `repository.${repository.pattern}.${repository.type}.${modifier}`;

/**
 * Generate all Elasticsearch roles for a given username, based on the associated memberships
 * @param {string} username - The username of the user we want to generate roles for
 * @returns {string[]} all roles for the user
 */
const generateUserRoles = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      memberships: {
        include: {
          spacePermissions: {
            include: {
              space: true,
            },
          },
          repositoryPermissions: {
            include: {
              repository: true,
            },
          },
        },
      },
    },
  });

  const roles = new Set(user?.memberships?.flatMap?.((membership) => {
    const repoRoles = membership?.repositoryPermissions?.map((perm) => generateRoleNameFromRepository(perm.repository, perm.readonly ? 'readonly' : 'all')) || [];
    const spaceRoles = membership?.spacePermissions?.map((perm) => generateRoleNameFromSpace(perm.space, perm.readonly ? 'readonly' : 'all')) || [];

    return [
      ...repoRoles,
      ...spaceRoles,
    ];
  }));

  if (user.isAdmin) {
    roles.add('superuser');
  }

  return Array.from(roles);
};

module.exports = {
  generateRoleNameFromSpace,
  generateRoleNameFromRepository,
  generateUserRoles,
};
