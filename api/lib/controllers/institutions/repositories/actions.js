const { prepareStandardQueryParams } = require('../../../services/std-query');

const RepositoriesService = require('../../../entities/repositories.service');
const RepoPermissionsService = require('../../../entities/repository-permissions.service');

const {
  schema,
  includableFields,
} = require('../../../entities/repositories.dto');

const {
  upsertSchema: permissionUpsertSchema,
} = require('../../../entities/repository-permissions.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../.prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['pattern'],
});
exports.standardQueryParams = standardQueryParams;

exports.getInstitutionRepositories = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutions = { some: { id: ctx.state.institution.id } };

  const repositoriesService = new RepositoriesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await repositoriesService.count({ where: prismaQuery.where }));
  ctx.body = await repositoriesService.findMany(prismaQuery);
};

exports.upsertRepositoryAllPermission = async (ctx) => {
  const { repository, institution } = ctx.state;

  const permissions = ctx.request.body;

  const repoPermissionsService = new RepoPermissionsService();
  // If a permission is not provided, we will delete it
  const newUsernames = new Set(permissions.map((permission) => permission.username));
  const oldPermissions = await repoPermissionsService.findMany({
    where: {
      repositoryPattern: repository.pattern,
      institutionId: institution.id,
    },
  });
  const permissionsToDelete = oldPermissions.filter((p) => !newUsernames.has(p.username));

  const newRepository = await RepoPermissionsService.$transaction(
    async (service) => {
      const repositoriesService = new RepositoriesService(service);

      await Promise.all([
        // Delete old permissions
        ...permissionsToDelete.map(
          (permission) => service.delete({
            where: {
              username_institutionId_repositoryPattern: {
                username: permission.username,
                institutionId: institution.id,
                repositoryPattern: repository.pattern,
              },
            },
          }),
        ),
        // Upsert new permissions (connect to existing models to avoid creating if doesn't exists)
        ...permissions.map(
          (permission) => service.upsert({
            where: {
              username_institutionId_repositoryPattern: {
                username: permission.username,
                institutionId: institution.id,
                repositoryPattern: repository.pattern,
              },
            },
            create: {
              readonly: permission.readonly,
              locked: permission.locked,
              repository: {
                connect: {
                  pattern: repository.pattern,
                },
              },
              membership: {
                connect: {
                  username_institutionId: {
                    username: permission.username,
                    institutionId: institution.id,
                  },
                },
              },
            },
            update: {
              readonly: permission.readonly,
              locked: permission.locked,
            },
          }),
        ),
      ]);

      return repositoriesService.findUnique({
        where: {
          pattern: repository.pattern,
          institutions: { some: { id: institution.id } },
        },
      });
    },
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = newRepository;
};

exports.upsertRepositoryPermission = async (ctx) => {
  const { repository, institution } = ctx.state;
  const { username } = ctx.params;

  const { value: body } = permissionUpsertSchema.validate({
    ...ctx.request.body,
    institutionId: institution.id,
    pattern: repository.pattern,
    username,
  });

  /** @type {RepositoryPermissionCreateInput} */
  const permissionData = {
    ...body,
    repository: {
      connect: {
        pattern: repository.pattern,
      },
    },
    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: institution.id,
        },
      },
    },
  };

  const repoPermissionsService = new RepoPermissionsService();

  ctx.status = 200;
  ctx.body = await repoPermissionsService.upsert({
    where: {
      username_institutionId_repositoryPattern: {
        username,
        institutionId: institution.id,
        repositoryPattern: repository.pattern,
      },
    },
    create: permissionData,
    update: permissionData,
  });
};

exports.deleteRepositoryPermission = async (ctx) => {
  const { repository, institution } = ctx.state;
  const { username } = ctx.params;

  const repoPermissionsService = new RepoPermissionsService();

  ctx.status = 200;
  ctx.body = await repoPermissionsService.delete({
    where: {
      username_institutionId_repositoryPattern: {
        username,
        institutionId: institution.id,
        repositoryPattern: repository.pattern,
      },
    },
  });
};

exports.removeRepository = async (ctx) => {
  const { repository } = ctx.state;
  const { pattern, institutionId } = ctx.params;

  const repositoriesService = new RepositoriesService();

  if (repository.institutions.length >= 2) {
    await repositoriesService.disconnectInstitution(pattern, institutionId);
  } else {
    await repositoriesService.delete({ where: { pattern } });
  }

  ctx.status = 204;
};

exports.addRepository = async (ctx) => {
  const { repository } = ctx.state;
  const { pattern, institutionId } = ctx.params;
  const { body } = ctx.request;

  if (repository && repository.type !== body.type) {
    ctx.throw(409, ctx.$t('errors.repository.typeMismatch', repository.pattern));
  }

  const repositoriesService = new RepositoriesService();

  ctx.status = repository ? 200 : 201;
  ctx.body = await repositoriesService.upsert({
    where: { pattern },
    create: {
      pattern,
      type: body.type,
      institutions: {
        connect: {
          id: institutionId,
        },
      },
    },
    update: {
      institutions: {
        connect: {
          id: institutionId,
        },
      },
    },
  });
};
