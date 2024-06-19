const { prepareStandardQueryParams } = require('../../../services/std-query');

const SushiCredentialsService = require('../../../entities/sushi-credentials.service');

const {
  schema,
  includableFields,
} = require('../../../entities/sushi-credentials.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const { connection, q: query } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutionId = ctx.state.institution.id;

  if (query) {
    prismaQuery.where = {
      ...prismaQuery.where,
      OR: [
        { endpoint: { vendor: { contains: query, mode: 'insensitive' } } },
        { institution: { name: { contains: query, mode: 'insensitive' } } },
        { institution: { acronym: { contains: query, mode: 'insensitive' } } },
      ],
    };
  }

  switch (connection) {
    case 'working':
      prismaQuery.where.connection = { path: ['status'], equals: 'success' };
      break;
    case 'unauthorized':
      prismaQuery.where.connection = { path: ['status'], equals: 'unauthorized' };
      break;
    case 'faulty':
      prismaQuery.where.connection = { path: ['status'], equals: 'failed' };
      break;
    case 'untested':
      prismaQuery.where.connection = { equals: {} };
      break;

    default:
      break;
  }

  const sushiCredentialsService = new SushiCredentialsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await sushiCredentialsService.count({ where: prismaQuery.where }));
  ctx.body = await sushiCredentialsService.findMany(prismaQuery);
};
