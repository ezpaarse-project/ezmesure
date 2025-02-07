const { prepareStandardQueryParams } = require('../../../services/std-query');

const MembershipsService = require('../../../entities/memberships.service');

const { includableFields, schema } = require('../../../entities/memberships.dto');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username'],
});
exports.standardQueryParams = standardQueryParams;

exports.getUserMemberships = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.username = ctx.params.username;

  const membershipsService = new MembershipsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await membershipsService.count({ where: prismaQuery.where }));
  ctx.body = await membershipsService.findMany(prismaQuery);
};
