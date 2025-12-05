const { client: prisma } = require("../services/prisma");

/**
 * @typedef {import('../.prisma/client.mts').Space} Space
 * @typedef {import('../.prisma/client.mts').Repository} Repository
 * @typedef {import('../.prisma/client.mts').RepositoryAlias} RepositoryAlias
 * @typedef {import('../.prisma/client.mts').ApiKey} ApiKey
 */

/**
 * @param {Space} space
 * @param {string} modifier
 */
const generateRoleNameFromSpace = (space, modifier) =>
  `space.${space.id}.${space.type}.${modifier}`;

/**
 * @param {Repository} repository
 * @param {string} modifier
 */
const generateRoleNameFromRepository = (repository, modifier) =>
  `repository.${repository.pattern}.${repository.type}.${modifier}`;

/**
 * @param {RepositoryAlias} alias
 */
const generateRoleNameFromAlias = (alias) => `alias.${alias.pattern}`;

/**
 * @param {ApiKey} apiKey
 */
const generateUsernameFromApiKey = (apiKey) => {
  if (!apiKey.institutionId) {
    throw new Error("The api key isn't related to an institution");
  }

  // From https://git-scm.com/book/en/v2/Git-Tools-Revision-Selection#Short-SHA-1 :
  //
  // Generally, eight to ten characters are more than enough to be unique within a project.
  // For example, as of February 2019, the Linux kernel (which is a fairly sizable project)
  // has over 875,000 commits and almost seven million objects in its object database,
  // with no two objects whose SHA-1s are identical in the first 12 characters.
  // ---
  // If we have more than 875,000 api keys in ezMESURE, there's a lot we'll need to refactor first
  const shortHash = apiKey.value.slice(0, 10);

  return `key.${apiKey.institutionId}.${shortHash}`;
};

/**
 *
 * @param {{ readonly: boolean }} entity
 * @returns
 */
const generateElasticPermissions = (entity) => {
  if (entity.readonly) {
    return { privileges: ["read", "view_index_metadata"] };
  }
  return { privileges: ["all"] };
};

/**
 *
 * @param {{ readonly: boolean }} entity
 * @returns
 */
const generateKibanaFeatures = (entity) => {
  if (entity.readonly) {
    return {
      features: {
        discover: ["read"],
        dashboard: ["read"],
        canvas: ["read"],
        maps: ["read"],
        visualize: ["read"],
      },
    };
  }
  return {
    features: {
      discover: ["all"],
      dashboard: ["all"],
      canvas: ["all"],
      maps: ["all"],
      visualize: ["all"],

      indexPatterns: ["all"],
      savedObjectsTagging: ["all"],
    },
  };
};

/**
 * Generate all Elasticsearch roles for a given username, based on the associated memberships
 * @param {string} username - The username of the user we want to generate roles for
 * @returns {Promise<string[]>} all roles for the user
 */
const generateUserRoles = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      elasticRoles: true,
      memberships: {
        include: {
          institution: {
            include: {
              elasticRoles: true,
            },
          },
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

  const additionalRoles = user.elasticRoles.map((role) => role.name);

  const roles = new Set(
    user.memberships?.flatMap?.((membership) => {
      const repoRoles =
        membership?.repositoryPermissions?.map((perm) =>
          generateRoleNameFromRepository(
            perm.repository,
            perm.readonly ? "readonly" : "all",
          ),
        ) || [];
      const aliasRoles =
        membership?.repositoryAliasPermissions?.map((perm) =>
          generateRoleNameFromAlias(perm.alias),
        ) || [];
      const spaceRoles =
        membership?.spacePermissions?.map((perm) =>
          generateRoleNameFromSpace(
            perm.space,
            perm.readonly ? "readonly" : "all",
          ),
        ) || [];
      const institutionRoles = membership?.institution?.elasticRoles.map(
        (role) => role.name,
      );

      return [
        ...repoRoles,
        ...aliasRoles,
        ...spaceRoles,
        ...institutionRoles,
        ...additionalRoles,
      ];
    }),
  );

  if (user?.isAdmin) {
    roles.add("superuser");
  }

  return Array.from(roles);
};

const generateApiKeyRoles = async (id) => {
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
    include: {
      institution: {
        select: { elasticRoles: true },
      },
      repositoryPermissions: {
        include: {
          repository: true,
        },
      },
      repositoryAliasPermissions: {
        include: {
          alias: true,
        },
      },
    },
  });

  if (!apiKey.institution) {
    throw new Error("The api key isn't related to an institution");
  }

  if (!apiKey) {
    return [];
  }

  return Array.from(
    new Set([
      ...apiKey.repositoryPermissions.map((perm) =>
        generateRoleNameFromRepository(
          perm.repository,
          perm.readonly ? "readonly" : "all",
        ),
      ),
      ...apiKey.repositoryAliasPermissions.map((perm) =>
        generateRoleNameFromAlias(perm.alias),
      ),
      ...apiKey.institution.elasticRoles.map((role) => role.name),
    ]),
  );
};

module.exports = {
  generateRoleNameFromAlias,
  generateRoleNameFromSpace,
  generateRoleNameFromRepository,
  generateUsernameFromApiKey,
  generateElasticPermissions,
  generateKibanaFeatures,
  generateUserRoles,
  generateApiKeyRoles,
};
