const repositoriesService = require('../../entities/repositories.service');
const repoPermissionsService = require('../../entities/repository-permissions.service');
const {
  upsertSchema: permissionUpsertSchema,
} = require('../../entities/repository-permissions.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

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

  const updatedPermissions = await repoPermissionsService.upsert({
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

  ctx.status = 200;
  ctx.body = updatedPermissions;
};

exports.deleteRepositoryPermission = async (ctx) => {
  const { repository, institution } = ctx.state;
  const { username } = ctx.params;

  const updatedPermissions = await repoPermissionsService.delete({
    where: {
      username_institutionId_repositoryPattern: {
        username,
        institutionId: institution.id,
        repositoryPattern: repository.pattern,
      },
    },
  });

  ctx.status = 200;
  ctx.body = updatedPermissions;
};

exports.removeRepository = async (ctx) => {
  const { repository } = ctx.state;
  const { pattern, institutionId } = ctx.params;

  if (repository.institutions.length >= 2) {
    await repositoriesService.update({
      where: { pattern },
      data: {
        institutions: {
          disconnect: {
            id: institutionId,
          },
        },
      },
    });
  } else {
    await repositoriesService.delete({
      where: { pattern },
    });
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

  ctx.status = repository ? 200 : 201;
};
