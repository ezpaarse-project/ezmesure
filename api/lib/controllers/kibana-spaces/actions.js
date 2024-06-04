const SpacesService = require('../../entities/spaces.service');

const {
  schema,
  includableFields,
  adminImportSchema,
} = require('../../entities/spaces.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const spacesService = new SpacesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await spacesService.count({ where: prismaQuery.where }));
  ctx.body = await spacesService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: ctx.params.spaceId });

  const spacesService = new SpacesService();
  const space = await spacesService.findUnique(prismaQuery);

  if (!space) {
    ctx.throw(404, ctx.$t('errors.institution.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = space;
};

exports.upsertOne = async (ctx) => {
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let space;

  try {
    space = await spacesService.upsert({
      where: { id: space.id },
      create: body,
      update: body,
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
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
  ctx.body = space;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let space;

  try {
    space = await spacesService.create({
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
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
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
  ctx.body = space;
};

exports.updateOne = async (ctx) => {
  const { space } = ctx.state;
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let updatedSushiCredentials;

  try {
    updatedSushiCredentials = await spacesService.update({
      where: { id: space.id },
      data: body,
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
          break;
        default:
      }
    }
  }

  ctx.status = 200;
  ctx.body = updatedSushiCredentials;
};

exports.deleteOne = async (ctx) => {
  const { spaceId } = ctx.params;

  const spacesService = new SpacesService();
  await spacesService.delete({ where: { id: spaceId } });

  ctx.status = 204;
};

exports.importMany = async (ctx) => {
  ctx.action = 'endpoint/import';
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
   * @param {SpacesService} spacesService
   * @param {*} endpointData
   */
  const importItem = async (spacesService, endpointData = {}) => {
    const { value: item, error } = adminImportSchema.validate(endpointData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const endpoint = await spacesService.findUnique({ where: { id: item.id } });

      if (endpoint && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.space.import.alreadyExists', endpoint.id));
        return;
      }
    }

    const endpoint = await spacesService.upsert({
      where: { id: item?.id },
      create: item,
      update: item,
    });

    addResponseItem(endpoint, 'created');
  };

  await SpacesService.$transaction(async (spacesService) => {
    for (let i = 0; i < body.length; i += 1) {
      const endpointData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(spacesService, endpointData);
      } catch (e) {
        addResponseItem(endpointData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
