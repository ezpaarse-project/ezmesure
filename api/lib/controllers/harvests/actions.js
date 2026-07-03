const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../utils/memory-queue');
const { createCache } = require('../../utils/cache-manager');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');
const { appLogger } = require('../../services/logger');

const HarvestsService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

const { schema, includableFields } = require('../../entities/harvest.dto');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

/**
  * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
  * @typedef {import('../../.prisma/client.mjs').Prisma.HarvestWhereInput} HarvestWhereInput
 */

exports.getHarvests = async (ctx) => {
  const {
    'period:from': from,
    'period:to': to,
    endpointId,
    institutionId,
    tags,
    packages,
  } = ctx.request.query;

  /** @type {HarvestFindManyArgs} */
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  if (institutionId || endpointId || tags || packages) {
    prismaQuery.where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: queryToPrismaFilter(tags).in },
      packages: packages && { hasSome: queryToPrismaFilter(packages).in },
    };
  }

  if (from || to) {
    prismaQuery.where.period = { gte: from, lte: to };
  }

  const harvestsService = new HarvestsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await harvestsService.count({ where: prismaQuery.where }));
  ctx.body = await harvestsService.findMany(prismaQuery);
};

exports.deleteHarvestsByQuery = async (ctx) => {
  const {
    credentialsId,
    reportId,
    period,
    status,
  } = ctx.request.body;

  /** @type {HarvestFindManyArgs} */
  const prismaQuery = {
    where: {
      credentialsId,
      reportId,
      period: {
        gte: period.from,
        lte: period.to,
      },
      status,
    },
  };

  const harvestsService = new HarvestsService();

  const deleted = await harvestsService.deleteMany(prismaQuery);

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = { deleted };
};

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;
const matrixCache = createCache(MATRIX_CACHE_DURATION);

const institutionsMatrixQueue = new InMemoryQueue(
  /**
   * Generate harvest matrix and cache it
   *
   * @param {string} id - Id in the cache
   * @param {*} query - query parameters
   */
  async (id, query) => {
    let data = {};

    try {
      data = (await matrixCache.get(id)) ?? {};

      appLogger.verbose(`[harvest-matrix][institutions][${id}] Generating matrix...`);

      const {
        'period:from': from,
        'period:to': to,
      } = query;

      const harvests = new HarvestsService();
      const institutions = new InstitutionsService();

      /** @type {HarvestWhereInput} */
      const where = {
        period: { gte: from, lte: to },
      };

      // Generate matrix
      const matrix = await harvests.getMatrix(
        (harvest) => harvest.credentials.institutionId,
        (harvest) => harvest.period,
        {
          where,
          include: {
            credentials: {
              select: { endpointId: true, institutionId: true },
            },
          },
        },
      );

      // Resolve headers
      appLogger.verbose(`[harvest-matrix][institutions][${id}] Resolving headers...`);
      const rows = await institutions.findMany({ where: { id: { in: matrix.headers.rows } } });

      // Resolve unharvested
      appLogger.verbose(`[harvest-matrix][institutions][${id}] Resolving unharvested...`);
      const unharvested = await institutions.findMany({
        where: {
          // Not in matrix (so not harvested for period)
          id: { notIn: matrix.headers.rows },
          // And have at least harvestable one credentials
          sushiCredentials: {
            some: {
              active: true,
              archived: false,
              endpoint: { active: true },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Cache matrix
      appLogger.verbose(`[harvest-matrix][institutions][${id}] Caching matrix for [${MATRIX_CACHE_DURATION}ms]...`);
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + MATRIX_CACHE_DURATION);
      data.unharvested = unharvested;
      data.matrix = {
        ...matrix,
        headers: {
          columns: matrix.headers.columns,
          rows,
        },
      };
    } catch (error) {
      appLogger.error(`[harvest-matrix][institutions][${id}] Something happened while generating matrix: ${error}`);
      // Cache error
      data.error = error;
    }
    await matrixCache.set(id, data);
  },
);

const endpointsMatrixQueue = new InMemoryQueue(
  /**
   * Generate harvest matrix and cache it
   *
   * @param {string} id - Id in the cache
   * @param {*} query - query parameters
   */
  async (id, query) => {
    let data = {};

    try {
      data = await matrixCache.get(id) ?? {};

      appLogger.verbose(`[harvest-matrix][sushi-endpoints][${id}] Generating matrix...`);

      const {
        'period:from': from,
        'period:to': to,
      } = query;

      const harvests = new HarvestsService();
      const endpoints = new EndpointsService();

      // Generate matrix
      const matrix = await harvests.getMatrix(
        (harvest) => harvest.credentials.endpointId,
        (harvest) => harvest.period,
        {
          where: {
            period: { gte: from, lte: to },
          },
          include: {
            credentials: {
              select: { endpointId: true },
            },
          },
        },
      );

      // Resolve headers
      appLogger.verbose(`[harvest-matrix][sushi-endpoints][${id}] Resolving headers...`);
      const rows = await endpoints.findMany({ where: { id: { in: matrix.headers.rows } } });

      // Cache matrix
      appLogger.verbose(`[harvest-matrix][sushi-endpoints][${id}] Caching matrix for [${MATRIX_CACHE_DURATION}ms]...`);
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + MATRIX_CACHE_DURATION);
      data.matrix = {
        ...matrix,
        headers: {
          columns: matrix.headers.columns,
          rows,
        },
      };
    } catch (error) {
      appLogger.error(`[harvest-matrix][sushi-endpoints][${id}] Something happened while generating matrix: ${error}`);
      // Cache error
      data.error = error;
    }
    await matrixCache.set(id, data);
  },
);

exports.getInstitutionsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const id = createHash('md5').update(JSON.stringify(query)).digest('hex');
  const requestId = `institutions:${id}`;
  const cached = await matrixCache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    await matrixCache.set(requestId, data);
    institutionsMatrixQueue.add(requestId, query);

    ctx.type = 'json';
    ctx.status = retryCode;
    ctx.body = data;
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

exports.getEndpointsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const id = createHash('md5').update(JSON.stringify(query)).digest('hex');
  const requestId = `endpoints:${id}`;
  const cached = await matrixCache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    await matrixCache.set(requestId, data);
    endpointsMatrixQueue.add(requestId, query);

    ctx.type = 'json';
    ctx.status = retryCode;
    ctx.body = data;
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
