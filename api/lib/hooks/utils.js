const { client: prisma } = require('../services/prisma');

/**
 * @typedef {import('@prisma/client').Space} Space
 * @typedef {import('@prisma/client').Repository} Repository
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
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
 * @param {RepositoryAlias} alias
 * @param {string} modifier
 */
const generateRoleNameFromAlias = (alias, repository) => `alias.${alias.pattern}.${repository.type}`;

/**
 * Generate all Elasticsearch roles for a given username, based on the associated memberships
 * @param {string} username - The username of the user we want to generate roles for
 * @returns {Promise<string[]>} all roles for the user
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
          repositoryAliasPermissions: {
            include: {
              alias: {
                include: {
                  repository: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  const roles = new Set(user.memberships?.flatMap?.((membership) => {
    const repoRoles = membership?.repositoryPermissions?.map((perm) => generateRoleNameFromRepository(perm.repository, perm.readonly ? 'readonly' : 'all')) || [];
    const aliasRoles = membership?.repositoryAliasPermissions?.map(
      (perm) => generateRoleNameFromAlias(perm.alias, perm.alias.repository),
    ) || [];
    const spaceRoles = membership?.spacePermissions?.map((perm) => generateRoleNameFromSpace(perm.space, perm.readonly ? 'readonly' : 'all')) || [];

    const permissions = new Set(membership.permissions);
    const otherRoles = [];
    // Compatibility with legacy reporting
    if (permissions.has('reporting:write')) {
      otherRoles.push('ezreporting');
    } else if (permissions.has('reporting:read')) {
      otherRoles.push('ezreporting_read_only');
    }

    return [
      ...repoRoles,
      ...aliasRoles,
      ...spaceRoles,
      ...otherRoles,
    ];
  }));

  if (user?.isAdmin) {
    roles.add('superuser');
  }

  return Array.from(roles);
};

module.exports = {
  generateRoleNameFromAlias,
  generateRoleNameFromSpace,
  generateRoleNameFromRepository,
  generateUserRoles,
};
