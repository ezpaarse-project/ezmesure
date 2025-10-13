const { prepareStandardQueryParams } = require('../../../services/std-query');

const SushiCredentialsService = require('../../../entities/sushi-credentials.service');
const HarvestsService = require('../../../entities/harvest.service');
const EndpointsService = require('../../../entities/sushi-endpoints.service');

const {
  schema,
  includableFields,
} = require('../../../entities/sushi-credentials.dto');
const InstitutionsService = require('../../../entities/institutions.service');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
 * @typedef {import('@prisma/client').Prisma.HarvestWhereInput} HarvestWhereInput
*/
/* eslint-enable max-len */

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;

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

const cache = new Map();

async function computeMatrix(id, query) {
  const data = { requestedAt: new Date() };

  try {
    cache.set(id, data);

    const {
      'period:from': from,
      'period:to': to,
      institutionId,
    } = query;

    const harvests = new HarvestsService();
    const endpoints = new EndpointsService();

    /** @type {HarvestWhereInput} */
    const where = {
      period: { gte: from, lte: to },
      credentials: {
        institutionId,
      },
    };

    const matrix = await harvests.getMatrix(
      (harvest) => harvest.credentials.endpointId,
      (harvest) => harvest.period,
      {
        where,
        include: {
          credentials: {
            select: { endpointId: true },
          },
        },
      },
    );

    // Resolve headers
    const rows = await endpoints.findMany({ where: { id: { in: matrix.headers.rows } } });

    // Get count of jobs by status
    const countsPerStatus = await harvests.groupBy({
      where,
      by: ['status'],
      _count: {
        _all: true,
      },
    });
    const statusCounts = Object.fromEntries(
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      countsPerStatus.map(({ status, _count }) => [status, _count?._all ?? 0]),
    );

    // Cache matrix
    data.generatedAt = new Date();
    data.validUntil = new Date(data.generatedAt.getTime() + MATRIX_CACHE_DURATION);
    data.statusCounts = statusCounts;
    data.matrix = {
      ...matrix,
      headers: {
        columns: matrix.headers.columns,
        rows,
      },
    };

    cache.set(id, data);
  } catch (error) {
    // Cache error
    data.error = error;
    cache.set(id, data);
  } finally {
    // Delete cache when it expires
    setTimeout(() => {
      cache.delete(id);
    }, MATRIX_CACHE_DURATION);
  }
}

exports.getMatrix = async (ctx) => {
  const { institutionId } = ctx.params;

  const { retryCode = 202, ...query } = ctx.request.query;
  query.institutionId = institutionId;

  const requestId = JSON.stringify(query);
  const cached = cache.get(requestId);

  if (!cached) {
    // Don't await promise so it runs in the background
    computeMatrix(requestId, query);

    ctx.type = 'json';
    ctx.status = retryCode;
    ctx.body = { requestedAt: new Date() };
    return;
  }

  if (cached.error) {
    ctx.throw(500, cached.error);
    return;
  }

  ctx.type = 'json';
  ctx.status = cached.matrix ? 200 : retryCode;
  ctx.body = cached;
};
