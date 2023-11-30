const repositoriesService = require('../../entities/repositories.service');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryWhereInput} RepositoryWhereInput
*/
/* eslint-enable max-len */

exports.getMany = async (ctx) => {
  const {
    include: propsToInclude,
    type,
    institutionId,
    pattern,
    q: search,
  } = ctx.query;

  let include;

  if (Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  /** @type {RepositoryWhereInput} */
  const where = {
    type,
    pattern,
  };

  if (institutionId) {
    where.institutions = {
      some: { id: institutionId },
    };
  }

  if (search) {
    where.pattern = {
      contains: search,
      mode: 'insensitive',
    };
  }

  ctx.type = 'json';
  ctx.body = await repositoriesService.findMany({ where, include });
};

exports.getOne = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = ctx.state.repository;
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

  await repositoriesService.delete({
    where: { pattern },
  });

  ctx.status = 204;
};
