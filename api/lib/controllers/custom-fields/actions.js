const CustomFieldsService = require('../../entities/custom-fields.service');

const {
  schema,
  includableFields,
  adminImportSchema,
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
      create: body,
      update: body,
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

exports.importFields = async (ctx) => {
  ctx.action = 'custom-fields/import';

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
   * @param {CustomFieldsService} customFieldsService
   * @param {*} itemData
   * @returns
   */
  const importItem = async (customFieldsService, itemData = {}) => {
    const { value: item, error } = adminImportSchema.validate(itemData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const field = await customFieldsService.findUnique({
        where: { id: item.id },
      });

      if (field && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.customFields.import.alreadyExists', field.id));
        return;
      }
    }

    const institution = await customFieldsService.upsert({
      where: { id: item?.id },
      create: item,
      update: item,
    });

    addResponseItem(institution, 'created');
  };

  await CustomFieldsService.$transaction(async (customFieldsService) => {
    for (let i = 0; i < body.length; i += 1) {
      const fieldData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(customFieldsService, fieldData);
      } catch (e) {
        addResponseItem(fieldData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
