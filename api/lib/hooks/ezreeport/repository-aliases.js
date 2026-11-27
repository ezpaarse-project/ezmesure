// @ts-check
const { registerHook } = require('../hookEmitter');

const InstitutionService = require('../../entities/institutions.service');
const { appLogger } = require('../../services/logger');

const ezrReportingUsers = require('../../services/ezreeport/reportingUsers');

/**
 * @typedef {import('../../.prisma/client.mjs').RepositoryAlias} RepositoryAlias
 */

/**
 * @param {{ alias: RepositoryAlias, institutionId: string }} opts
 */
const onRepositoryAliasLink = async ({ institutionId }) => {
  let username;
  try {
    ({ username } = await ezrReportingUsers.upsertReportUserFromInstitutionId(institutionId));
    appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
  } catch (error) {
    appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
  }
};

/**
 * @param {RepositoryAlias} repositoryAlias
 */
const onRepositoryAliasModified = async (repositoryAlias) => {
  const institutionService = new InstitutionService();
  const institutions = await institutionService.findMany({
    where: { repositoryAliases: { some: { pattern: repositoryAlias.pattern } } },
    select: { id: true },
  });

  await Promise.all(
    institutions.map(({ id }) => onRepositoryAliasLink({
      alias: repositoryAlias,
      institutionId: id,
    })),
  );
};

const hookOptions = { uniqueResolver: (repositoryAlias) => repositoryAlias.pattern };

registerHook('repository_alias:create', onRepositoryAliasModified, hookOptions);
registerHook('repository_alias:update', onRepositoryAliasModified, hookOptions);
registerHook('repository_alias:upsert', onRepositoryAliasModified, hookOptions);
registerHook('repository_alias:delete', onRepositoryAliasModified, hookOptions);

registerHook('repository_alias:connected', onRepositoryAliasLink, hookOptions);
registerHook('repository_alias:disconnected', onRepositoryAliasLink, hookOptions);
