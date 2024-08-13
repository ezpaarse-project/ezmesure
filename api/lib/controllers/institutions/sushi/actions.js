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
  queryFields: ['endpoint.vendor'],
});
exports.standardQueryParams = standardQueryParams;

const SUCCESS_FILTER = { path: ['status'], equals: 'success' };
const UNAUTHORIZED_FILTER = { path: ['status'], equals: 'unauthorized' };
const FAILED_FILTER = { path: ['status'], equals: 'failed' };
const UNTESTED_FILTER = { equals: {} };

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
      prismaQuery.where.connection = SUCCESS_FILTER;
      break;
    case 'unauthorized':
      prismaQuery.where.connection = UNAUTHORIZED_FILTER;
      break;
    case 'faulty':
      prismaQuery.where.connection = FAILED_FILTER;
      break;
    case 'untested':
      prismaQuery.where.connection = UNTESTED_FILTER;
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

exports.getMetrics = async (ctx) => {
  const sushiCredentialsService = new SushiCredentialsService();

  const [
    untested,
    unauthorized,
    failed,
    success,
  ] = await Promise.all(
    [UNTESTED_FILTER, UNAUTHORIZED_FILTER, FAILED_FILTER, SUCCESS_FILTER].map(
      (connection) => sushiCredentialsService.count({
        where: {
          connection,
          institutionId: ctx.state.institution.id,
        },
      }),
    ),
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    statuses: {
      untested,
      unauthorized,
      failed,
      success,
    },
  };
};
