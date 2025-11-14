const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../utils/memory-queue');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');
const { appLogger } = require('../../services/logger');

const HarvestsService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

const { schema, includableFields } = require('../../entities/harvest.dto');

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

/**
  * @typedef {import('../../.prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
  * @typedef {import('../../.prisma/client').Prisma.HarvestWhereInput} HarvestWhereInput
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

const institutionsMatrixManager = {
  createId: (query) => createHash('md5').update(JSON.stringify(query)).digest('hex'),
  cache: new Map(),
  queue: new InMemoryQueue(
    /**
     * Generate harvest matrix and cache it
     *
     * @param {string} id - Id in the cache
     * @param {*} query - query parameters
     */
    async (id, query) => {
      let data = {};

      try {
        data = institutionsMatrixManager.cache.get(id) ?? {};

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

        institutionsMatrixManager.cache.set(id, data);
      } catch (error) {
        appLogger.error(`[harvest-matrix][institutions][${id}] Something happened while generating matrix: ${error}`);
        // Cache error
        data.error = error;
        institutionsMatrixManager.cache.set(id, data);
      } finally {
        // Delete cache when it expires
        setTimeout(() => {
          appLogger.verbose(`[harvest-matrix][institutions][${id}] Clearing cache entry`);
          institutionsMatrixManager.cache.delete(id);
        }, MATRIX_CACHE_DURATION);
      }
    },
  ),
};

const endpointsMatrixManager = {
  createId: (query) => createHash('md5').update(JSON.stringify(query)).digest('hex'),
  cache: new Map(),
  queue: new InMemoryQueue(
    /**
     * Generate harvest matrix and cache it
     *
     * @param {string} id - Id in the cache
     * @param {*} query - query parameters
     */
    async (id, query) => {
      let data = {};

      try {
        data = endpointsMatrixManager.cache.get(id) ?? {};

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

        endpointsMatrixManager.cache.set(id, data);
      } catch (error) {
        appLogger.error(`[harvest-matrix][sushi-endpoints][${id}] Something happened while generating matrix: ${error}`);
        // Cache error
        data.error = error;
        endpointsMatrixManager.cache.set(id, data);
      } finally {
        // Delete cache when it expires
        setTimeout(() => {
          appLogger.verbose(`[harvest-matrix][sushi-endpoints][${id}] Clearing cache entry`);
          endpointsMatrixManager.cache.delete(id);
        }, MATRIX_CACHE_DURATION);
      }
    },
  ),
};

exports.getInstitutionsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const requestId = institutionsMatrixManager.createId(query);
  const cached = institutionsMatrixManager.cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    institutionsMatrixManager.cache.set(requestId, data);
    institutionsMatrixManager.queue.add(requestId, query);

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

  const requestId = endpointsMatrixManager.createId(query);
  const cached = endpointsMatrixManager.cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    endpointsMatrixManager.cache.set(requestId, data);
    endpointsMatrixManager.queue.add(requestId, query);

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
