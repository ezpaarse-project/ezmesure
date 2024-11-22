const CustomFieldsService = require('../../entities/custom-fields.service');

const {
  schema,
  includableFields,
} = require('../../entities/custom-fields.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const service = new CustomFieldsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await service.count({ where: prismaQuery.where }));
  ctx.body = await service.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: ctx.params.fieldId });

  const service = new CustomFieldsService();
  const customField = await service.findUnique(prismaQuery);

  if (!customField) {
    ctx.throw(404, ctx.$t('errors.customField.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = customField;
};

exports.upsertOne = async (ctx) => {
  const { fieldId } = ctx.params;
  const { body } = ctx.request;

  const { upserted, existing } = await CustomFieldsService.$transaction(async (service) => ({
    existing: await service.findUnique({
      where: { id: fieldId },
    }),
    upserted: await service.upsert({
      where: { id: fieldId },
      create: { ...body, id: fieldId },
      update: { ...body, id: fieldId },
    }),
  }));

  ctx.status = existing ? 200 : 201;
  ctx.body = upserted;
};

exports.deleteOne = async (ctx) => {
  const { fieldId } = ctx.params;

  const service = new CustomFieldsService();
  await service.delete({ where: { id: fieldId } });

  ctx.status = 204;
};
