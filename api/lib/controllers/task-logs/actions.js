const LogService = require('../../entities/log.service');

/** @typedef {import('@prisma/client').Prisma.LogWhereInput} LogWhereInput */

const { schema, includableFields } = require('../../entities/log.dto');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['message'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const logService = new LogService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await logService.count({ where: prismaQuery.where }));
  ctx.body = await logService.findMany(prismaQuery);
};
