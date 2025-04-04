const UsersService = require('../../entities/users.service');
const InstitutionsService = require('../../entities/institutions.service');
const SpacesService = require('../../entities/spaces.service');
const RepositoriesService = require('../../entities/repositories.service');
const RepositoryAliasesService = require('../../entities/repository-aliases.service');

const {
  startSync,
  isSynchronizing,
  getStatus,
} = require('../../services/sync');
const { appLogger } = require('../../services/logger');

exports.startSync = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 202;

  if (!isSynchronizing()) {
    startSync().catch((err) => {
      appLogger.error(`[sync] Synchronization failed: ${err}`);
    });
  }

  ctx.body = getStatus();
};

exports.getSyncStatus = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;

  const expectedPromises = {
    users: new UsersService().count(),
    institutions: new InstitutionsService().count({ where: { validated: true } }),
    spaces: new SpacesService().count(),
    repositories: new RepositoriesService().count(),
    repositoryAliases: new RepositoryAliasesService().count(),
  };

  const expectedEntries = await Promise.all(
    Object.entries(expectedPromises)
      .map(async ([key, promise]) => [key, await promise]),
  );

  ctx.body = {
    data: getStatus(),
    expected: Object.fromEntries(expectedEntries),
  };
};
