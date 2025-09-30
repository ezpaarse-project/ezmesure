const { prepareStandardQueryParams } = require('../../../services/std-query');

const SushiCredentialsService = require('../../../entities/sushi-credentials.service');

const {
  schema,
  includableFields,
} = require('../../../entities/sushi-credentials.dto');
const InstitutionsService = require('../../../entities/institutions.service');

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

const SUCCESS_FILTER = { path: ['status'], equals: 'success' };
const UNAUTHORIZED_FILTER = { path: ['status'], equals: 'unauthorized' };
const FAILED_FILTER = { path: ['status'], equals: 'failed' };
const UNTESTED_FILTER = { equals: {} };

exports.getAll = async (ctx) => {
  const { connection, q: query } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutionId = ctx.state.institution.id;

  if (query) {
    prismaQuery.where.endpoint = { vendor: { contains: query, mode: 'insensitive' } };
  }

  switch (connection) {
    case 'working':
    case 'success':
      prismaQuery.where.connection = SUCCESS_FILTER;
      break;
    case 'unauthorized':
      prismaQuery.where.connection = UNAUTHORIZED_FILTER;
      break;
    case 'failed':
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

  // Get counts of credentials
  const [
    untested,
    unauthorized,
    failed,
    success,
  ] = await Promise.all(
    [UNTESTED_FILTER, UNAUTHORIZED_FILTER, FAILED_FILTER, SUCCESS_FILTER].map(
      async (connection) => ({
        total: await sushiCredentialsService.count({
          where: {
            connection,
            institutionId: ctx.state.institution.id,
            archived: false,
          },
        }),
        enabled: await sushiCredentialsService.count({
          where: {
            connection,
            institutionId: ctx.state.institution.id,
            ...SushiCredentialsService.enabledCredentialsQuery,
          },
        }),
      }),
    ),
  );

  // Get if institution is harvestable
  const institutionService = new InstitutionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    harvestable: await institutionService.isHarvestable(
      ctx.state.institution.id,
      { allowHarvested: true },
    ),
    statuses: {
      untested,
      unauthorized,
      failed,
      success,
    },
  };
};
