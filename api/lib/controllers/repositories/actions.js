const RepositoriesService = require('../../entities/repositories.service');
const { schema, includableFields } = require('../../entities/repositories.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

/* eslint-disable max-len */
/**
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
