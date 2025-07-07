// @ts-check
const { registerHook } = require('../hookEmitter');

const MembershipsService = require('../../entities/memberships.service');
const RepositoryAliasPermissionsService = require('../../entities/repository-alias-permissions.service');

const { appLogger } = require('../../services/logger');

const {
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('../../entities/memberships.dto');

const {
  syncRepositoryAlias,
  unmountAlias,
  syncRepositoryIndexTemplate,
} = require('../../services/sync/elastic');

/**
 * @typedef {import('@prisma/client').RepositoryAlias} RepositoryAlias
 */

/**
 * Give permissions to the contacts of an institution that are connected to an alias
 * @param {RepositoryAlias} alias
 */
const givePermissionsToContacts = async (alias, institutionId) => {
  const membershipsService = new MembershipsService();
  const repositoryAliasPermissionsService = new RepositoryAliasPermissionsService();

  const contacts = await membershipsService.findMany({
    where: {
      roles: {
        hasSome: [DOC_CONTACT, TECH_CONTACT],
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
  for (const contact of contacts) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await repositoryAliasPermissionsService.upsert({
        where: {
          username_institutionId_aliasPattern: {
            aliasPattern: alias.pattern,
            institutionId: contact.institutionId,
            username: contact.username,
          },
        },
        update: {
          aliasPattern: alias.pattern,
        },
        create: {
          username: contact.username,
          institutionId: contact.institutionId,
          aliasPattern: alias.pattern,
        },
      });
    } catch (e) {
      appLogger.error(`[elastic] Permissions for alias [${alias.pattern}] cannot be granted to [${contact.username}] in institution [${contact.institutionId}]:\n${e}`);
    }

    appLogger.verbose(`[elastic] Permissions for alias [${alias.pattern}] has been granted to [${contact.username}] in institution [${contact.institutionId}]`);
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
    await givePermissionsToContacts(alias, institutionId);
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
