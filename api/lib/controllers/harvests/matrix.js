const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../utils/memory-queue');
const { createCache } = require('../../utils/cache-manager');

const { appLogger } = require('../../services/logger');

const HarvestsService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

const CACHE_DURATION = 5 * 60 * 1000;
const cache = createCache(CACHE_DURATION);

const institutionsQueue = new InMemoryQueue(
  /**
   * Generate harvest matrix and cache it
   *
   * @param {string} id - Id in the cache
   * @param {*} query - query parameters
   */
  async (id, query) => {
    let data = {};

    try {
      data = (await cache.get(id)) ?? {};

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
      appLogger.verbose(`[harvest-matrix][institutions][${id}] Caching matrix for [${CACHE_DURATION}ms]...`);
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + CACHE_DURATION);
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
    await cache.set(id, data);
  },
);

const endpointsQueue = new InMemoryQueue(
  /**
   * Generate harvest matrix and cache it
   *
   * @param {string} id - Id in the cache
   * @param {*} query - query parameters
   */
  async (id, query) => {
    let data = {};

    try {
      data = await cache.get(id) ?? {};

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
      appLogger.verbose(`[harvest-matrix][sushi-endpoints][${id}] Caching matrix for [${CACHE_DURATION}ms]...`);
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + CACHE_DURATION);
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
    await cache.set(id, data);
  },
);

exports.getInstitutionsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const id = createHash('md5').update(JSON.stringify(query)).digest('hex');
  const requestId = `institutions:${id}`;
  const cached = await cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    await cache.set(requestId, data);
    institutionsQueue.add(requestId, query);

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
  const cached = await cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    await cache.set(requestId, data);
    endpointsQueue.add(requestId, query);

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
