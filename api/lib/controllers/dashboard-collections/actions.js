const DashboardCollectionsService = require('../../entities/dashboard-collection.service');

const { schema, includableFields, adminImportSchema } = require('../../entities/dashboard-collection.dto');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id', 'name', 'description'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const collectionsService = new DashboardCollectionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await collectionsService.count({ where: prismaQuery.where }));
  ctx.body = await collectionsService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

  const collectionsService = new DashboardCollectionsService();
  const collection = await collectionsService.findUnique(prismaQuery);

  if (!collection) {
    ctx.throw(404, ctx.$t('errors.collection.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = collection;
};

exports.upsertOne = async (ctx) => {
  const { id } = ctx.params;
  const { body } = ctx.request;

  const { upserted, existing } = await DashboardCollectionsService.$transaction(async (service) => {
    if (body.id && body.id !== id) {
      const conflict = await service.findUnique({ where: { id: body.id } });
      if (conflict) {
        ctx.throw(409, ctx.$t('errors.collection.alreadyExists', body.id));
      }
    }

    const existingCollection = await service.findUnique({
      where: { id },
    });

    const upsertedCollection = await service.upsert({
      where: { id },
      create: { ...body },
      update: { ...body },
    });

    return {
      existing: existingCollection,
      upserted: upsertedCollection,
    };
  });

  ctx.status = existing ? 200 : 201;
  ctx.body = upserted;
};

exports.deleteOne = async (ctx) => {
  const { id } = ctx.params;

  const collectionsService = new DashboardCollectionsService();
  await collectionsService.delete({ where: { id } });

  ctx.status = 204;
};

exports.addToSpace = async (ctx) => {
  const { id, spaceId } = ctx.params;
  const { repositoryPattern } = ctx.request.body;

  await (new DashboardCollectionsService()).addToSpace(id, spaceId, repositoryPattern);

  ctx.status = 204;
};

exports.removeFromSpace = async (ctx) => {
  const { id, spaceId } = ctx.params;
  const { repositoryPattern } = ctx.request.body;

  await (new DashboardCollectionsService()).removeFromSpace(id, spaceId, repositoryPattern);

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
   * @param {DashboardCollectionsService} collectionsService
   * @param {*} collectionData
   */
  const importItem = async (collectionsService, collectionData = {}) => {
    const { value: item, error } = adminImportSchema.validate(collectionData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const collection = await collectionsService.findUnique({ where: { id: item.id } });

      if (collection && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.collection.alreadyExists', collection.id));
        return;
      }
    }

    const collection = await collectionsService.upsert({
      where: { id: item.id },
      create: { ...item },
      update: { ...item },
    });

    addResponseItem(collection, 'created');
  };

  await DashboardCollectionsService.$transaction(async (collectionsService) => {
    for (let i = 0; i < body.length; i += 1) {
      const collectionData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(collectionsService, collectionData);
      } catch (e) {
        addResponseItem(collectionData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
