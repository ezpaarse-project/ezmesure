// @ts-check
const { registerHook } = require('../hookEmitter');

const InstitutionService = require('../../entities/institutions.service');
const { appLogger } = require('../../services/logger');

const ezrReportingUsers = require('../../services/ezreeport/reportingUsers');

/**
 * @typedef {import('@prisma/client').Repository} Repository
 */

/**
 * @param { Repository } repository
 */
const onRepositoryModified = async (repository) => {
  const institutionService = new InstitutionService();
  const institutions = await institutionService.findMany({
    where: { repositories: { some: { pattern: repository.pattern } } },
  });

  await Promise.all(
    institutions.map(async ({ id }) => {
      let username;
      try {
        ({ username } = await ezrReportingUsers.upsertReportUserFromInstitutionId(id));
        appLogger.verbose(`[ezreeport][hooks] Reporting user [${username}] is upserted in elastic`);
      } catch (error) {
        appLogger.error(`[ezreeport][hooks] Reporting user [${username}] cannot be upserted in elastic:\n${error}`);
      }
    }),
  );
};

const hookOptions = { uniqueResolver: (repository) => repository.pattern };

registerHook('repository:create', onRepositoryModified, hookOptions);
registerHook('repository:update', onRepositoryModified, hookOptions);
registerHook('repository:upsert', onRepositoryModified, hookOptions);
registerHook('repository:disconnected', onRepositoryModified, hookOptions);
registerHook('repository:delete', onRepositoryModified, hookOptions);
