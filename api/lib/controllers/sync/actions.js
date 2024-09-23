const UsersService = require('../../entities/users.service');
const InstitutionsService = require('../../entities/institutions.service');
const SpacesService = require('../../entities/spaces.service');
const RepositoriesService = require('../../entities/repositories.service');

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

  const expectedServices = {
    users: { service: new UsersService() },
    institutions: { service: new InstitutionsService(), where: { validated: true } },
    spaces: { service: new SpacesService() },
    repositories: { service: new RepositoriesService() },
  };

  const entries = await Promise.all(
    Object.entries(expectedServices)
      .map(([k, { service, where }]) => service.count({ where }).then((v) => [k, v])),
  );

  ctx.body = {
    data: getStatus(),
    expected: Object.fromEntries(entries),
  };
};
