const repositoriesService = require('../../entities/repositories.service');
const repoPermissionsService = require('../../entities/repository-permissions.service');
const {
  upsertSchema: permissionUpsertSchema,
} = require('../../entities/repository-permissions.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma.service');

exports.getMany = async (ctx) => {
  const {
    type,
    institutionId,
    q: search,
  } = ctx.query;

  const where = {
    type,
    institutionId,
  };

  if (search) {
    where.pattern = {
      contains: search,
      mode: 'insensitive',
    };
  }

  ctx.type = 'json';
  ctx.body = await repositoriesService.findMany({ where });
};

exports.getOne = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = ctx.state.repository;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  let repository;

  try {
    repository = await repositoriesService.create({
      data: {
        ...body,
        institution: { connect: { id: body?.institutionId } },
        institutionId: undefined,
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.repository.alreadyExists', body?.pattern));
          break;
        case PrismaErrors.RecordNotFound:
          ctx.throw(404, ctx.$t('errors.institution.notFound'));
          break;
        default:
      }
    }
    throw e;
  }

  ctx.status = 201;
  ctx.body = repository;
};

exports.updateOne = async (ctx) => {
  const { repository } = ctx.state;
  const { body } = ctx.request;

  let updatedSushiCredentials;

  try {
    updatedSushiCredentials = await repositoriesService.update({
      where: { id: repository.id },
      data: body,
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.repository.alreadyExists', body?.pattern));
          break;
        default:
      }
    }
  }

  ctx.status = 200;
  ctx.body = updatedSushiCredentials;
};

exports.deleteOne = async (ctx) => {
  const { repositoryId } = ctx.params;

  await repositoriesService.delete({ where: { id: repositoryId } });

  ctx.status = 204;
};

exports.upsertPermission = async (ctx) => {
  const { repository } = ctx.state;
  const { username } = ctx.params;

  const { value: body } = permissionUpsertSchema.validate({
    ...ctx.request.body,
    institutionId: repository.institutionId,
    repositoryId: repository.id,
    username,
  });

  const permissionData = {
    ...body,
    repository: { connect: { id: repository.id } },
    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: repository.institutionId,
        },
      },
    },
  };

  const updatedPermissions = await repoPermissionsService.upsert({
    where: {
      username_repositoryId: {
        username,
        repositoryId: repository.id,
      },
    },
    create: permissionData,
    update: permissionData,
  });

  ctx.status = 200;
  ctx.body = updatedPermissions;
};

exports.deletePermission = async (ctx) => {
  const { repository } = ctx.state;
  const { username } = ctx.params;

  const updatedPermissions = await repoPermissionsService.delete({
    where: {
      username_repositoryId: {
        username,
        repositoryId: repository.id,
      },
    },
  });

  ctx.status = 200;
  ctx.body = updatedPermissions;
};
