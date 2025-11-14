// @ts-check
const { registerHook } = require('../hookEmitter');

const MembershipsService = require('../../entities/memberships.service');
const RepositoryAliasPermissionsService = require('../../entities/repository-alias-permissions.service');

const { appLogger } = require('../../services/logger');

const {
  syncRepositoryAlias,
  unmountAlias,
  syncRepositoryIndexTemplate,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('../../.prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * Give alias permissions to the members of an institution
 * that have a role with "repositories" permissions preset
 * @param {RepositoryAlias} alias
 */
const givePermissionsToMembers = async (alias, institutionId) => {
  const membershipsService = new MembershipsService();
  const repositoryAliasPermissionsService = new RepositoryAliasPermissionsService();

  const memberships = await membershipsService.findMany({
    where: {
      roles: {
        some: {
          role: {
            OR: [
              { permissionsPreset: { path: ['repositories'], equals: 'read' } },
              { permissionsPreset: { path: ['repositories'], equals: 'write' } },
            ],
          },
        },
      },
      institution: {
        id: institutionId,
      },
    },
    select: {
      username: true,
      institutionId: true,
    },
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const member of memberships) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await repositoryAliasPermissionsService.upsert({
        where: {
          username_institutionId_aliasPattern: {
            aliasPattern: alias.pattern,
            institutionId: member.institutionId,
            username: member.username,
          },
        },
        update: {
          aliasPattern: alias.pattern,
        },
        create: {
          username: member.username,
          institutionId: member.institutionId,
          aliasPattern: alias.pattern,
        },
      });
    } catch (e) {
      appLogger.error(`[elastic] Permissions for alias [${alias.pattern}] cannot be granted to [${member.username}] in institution [${member.institutionId}]:\n${e}`);
    }

    appLogger.verbose(`[elastic] Permissions for alias [${alias.pattern}] has been granted to [${member.username}] in institution [${member.institutionId}]`);
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasUpsert = async (repositoryAlias) => {
  try {
    await syncRepositoryAlias(repositoryAlias);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] RepositoryAlias [${repositoryAlias?.pattern}] could not be synchronized:\n${error}`,
    );
  }
};

/**
 * @param {{ alias: RepositoryAlias, institutionId: string }} opts
 */
const onRepositoryAliasConnected = async ({ alias, institutionId }) => {
  try {
    await givePermissionsToMembers(alias, institutionId);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Permissions for RepositoryAlias [${alias?.pattern}] could not be granted:\n${error}`,
    );
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasDelete = async (repositoryAlias) => {
  try {
    await unmountAlias(repositoryAlias);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] RepositoryAlias [${repositoryAlias?.pattern}] could not be unmounted:\n${error}`,
    );
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const syncTargetIndexTemplate = async (repositoryAlias) => {
  try {
    await syncRepositoryIndexTemplate(repositoryAlias.target);
  } catch (error) {
    appLogger.error(
      `[elastic][hooks] Index template for repository [${repositoryAlias?.target}] could not be synced:\n${error}`,
    );
  }
};

const hookOptions = { uniqueResolver: (repositoryAlias) => repositoryAlias.pattern };
const debounceByTarget = { uniqueResolver: (repositoryAlias) => repositoryAlias.target };

registerHook('repository_alias:create', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:update', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:upsert', onRepositoryAliasUpsert, hookOptions);
registerHook('repository_alias:delete', onRepositoryAliasDelete, hookOptions);

registerHook('repository_alias:connected', onRepositoryAliasConnected, hookOptions);

// Sync of repository index template is debounced by target repository pattern
// That way we avoid spamming template syncs when a lot of aliases are created or removed at once
registerHook('repository_alias:create', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:update', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:upsert', syncTargetIndexTemplate, debounceByTarget);
registerHook('repository_alias:delete', syncTargetIndexTemplate, debounceByTarget);
