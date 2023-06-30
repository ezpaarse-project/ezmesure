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
const generateRoleNameFromRepository = (repository, modifier) => `repository.${repository.pattern}.${repository.type}.${modifier}.${repository.id}`;

const generateRolesOfMembership = async (username, institutionId) => {
  const membership = await prisma.membership.findUnique({
    where: {
      username_institutionId: {
        username,
        institutionId,
      },
    },
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
  });

  const repoRoles = membership?.repositoryPermissions?.map((perm) => generateRoleNameFromRepository(perm.repository, perm.readonly ? 'readonly' : 'all')) || [];
  const spaceRoles = membership?.spacePermissions?.map((perm) => generateRoleNameFromSpace(perm.space, perm.readonly ? 'readonly' : 'all')) || [];

  return [...repoRoles, ...spaceRoles];
};

module.exports = {
  generateRoleNameFromSpace,
  generateRoleNameFromRepository,
  generateRolesOfMembership,
};
