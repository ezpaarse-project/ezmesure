const RepositoriesService = require('../../entities/repositories.service');

const {
  schema,
  includableFields,
  adminImportSchema,
} = require('../../entities/repositories.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryCreateInput} RepositoryCreateInput
 * @typedef {import('@prisma/client').Prisma.RepositoryWhereInput} RepositoryWhereInput
*/
/* eslint-enable max-len */

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['pattern'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const { institutionId } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (institutionId) {
    prismaQuery.where.institutions = {
      some: { id: institutionId },
    };
  }

  const repositoriesService = new RepositoriesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await repositoriesService.count({ where: prismaQuery.where }));
  ctx.body = await repositoriesService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { pattern } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { pattern });

  const repositoriesService = new RepositoriesService();
  const repository = await repositoriesService.findUnique(prismaQuery);

  if (!repository) {
    ctx.throw(404, ctx.$t('errors.repository.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = repository;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  let repository;

  const configUpsert = {
    create: {
      ...body,
      institutionId: undefined,
    },
    update: {
      institutionId: undefined,
    },
  };

  if (body?.institutionId) {
    configUpsert.create.institutions = { connect: { id: body?.institutionId } };
    configUpsert.update.institutions = { connect: { id: body?.institutionId } };
  }

  const repositoriesService = new RepositoriesService();

  try {
    repository = await repositoriesService.upsert({
      where: { pattern: body.pattern },
      ...configUpsert,
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

  let updatedRepository;

  const repositoriesService = new RepositoriesService();

  try {
    updatedRepository = await repositoriesService.update({
      where: {
        pattern: repository.pattern,
      },
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
    } else {
      throw e;
    }
  }

  ctx.status = 200;
  ctx.body = updatedRepository;
};

exports.deleteOne = async (ctx) => {
  const { pattern } = ctx.params;

  const repositoriesService = new RepositoriesService();

  await repositoriesService.delete({
    where: { pattern },
  });

  ctx.status = 204;
};

exports.importMany = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {RepositoriesService} repositoriesService
   * @param {*} endpointData
   */
  const importItem = async (repositoriesService, endpointData = {}) => {
    const { value: item, error } = adminImportSchema.validate(endpointData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.pattern) {
      const repo = await repositoriesService.findUnique({ where: { pattern: item.pattern } });

      if (repo && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.repository.alreadyExists', repo.pattern));
        return;
      }
    }

    /** @type {RepositoryCreateInput} */
    const data = {
      ...item,
      permissions: {
        connectOrCreate: item.permissions?.map(
          (permission) => ({
            where: {
              username_institutionId_repositoryPattern: {
                username: permission.username,
                institutionId: permission.institutionId,
                repositoryPattern: item.pattern,
              },
            },
            create: {
              ...permission,
              username: undefined,
              institutionId: undefined,
              repositoryPattern: undefined,
              membership: {
                connect: {
                  username_institutionId: {
                    username: permission.username,
                    institutionId: permission.institutionId,
                  },
                },
              },
            },
          }),
        ),
      },
      institutions: {
        connect: item.institutions?.map(
          (institution) => ({
            id: institution.id,
          }),
        ),
      },
    };

    const repo = await repositoriesService.upsert({
      where: { pattern: item.pattern },
      create: data,
      update: data,
    });

    addResponseItem(repo, 'created');
  };

  await RepositoriesService.$transaction(async (repositoriesService) => {
    for (let i = 0; i < body.length; i += 1) {
      const repoData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(repositoriesService, repoData);
      } catch (e) {
        addResponseItem(repoData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
