const { schema, includableFields } = require('../../../entities/actions.dto');

const { prepareStandardQueryParams } = require('../../../services/std-query');

const ActionsService = require('../../../entities/actions.service');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const actionsService = new ActionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await actionsService.count({ where: prismaQuery.where }));
  ctx.body = await actionsService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

  const actionsService = new ActionsService();
  const action = await actionsService.findUnique(prismaQuery);

  if (!action) {
    ctx.throw(404, ctx.$t('errors.action.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = action;
};
