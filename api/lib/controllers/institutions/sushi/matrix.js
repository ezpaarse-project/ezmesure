const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../../utils/memory-queue');
const { createCache } = require('../../../utils/cache-manager');

const { appLogger } = require('../../../services/logger');

const HarvestsService = require('../../../entities/harvest.service');
const EndpointsService = require('../../../entities/sushi-endpoints.service');

const CACHE_DURATION = 5 * 60 * 1000;
const cache = createCache(CACHE_DURATION);

const queue = new InMemoryQueue(
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

      appLogger.verbose(`[harvest-matrix][institutions.${query.institutionId}][${id}] Generating matrix...`);

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
      appLogger.verbose(`[harvest-matrix][institutions.${query.institutionId}][${id}] Resolving headers...`);
      const rows = await endpoints.findMany({ where: { id: { in: matrix.headers.rows } } });

      appLogger.verbose(`[harvest-matrix][institutions.${query.institutionId}][${id}] Aggregating statuses...`);
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

      appLogger.verbose(`[harvest-matrix][institutions.${query.institutionId}][${id}] Caching matrix for [${CACHE_DURATION}ms]...`);
      // Cache matrix
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + CACHE_DURATION);
      data.statusCounts = statusCounts;
      data.matrix = {
        ...matrix,
        headers: {
          columns: matrix.headers.columns,
          rows,
        },
      };
    } catch (error) {
      appLogger.error(`[harvest-matrix][institutions.${query.institutionId}][${id}] Something happened while generating matrix: ${error}`);
      // Cache error
      data.error = error;
    }
    await cache.set(id, data);
  },
);

exports.getMatrix = async (ctx) => {
  const { institutionId } = ctx.params;

  const { retryCode = 202, ...query } = ctx.request.query;
  query.institutionId = institutionId;

  const requestId = createHash('md5').update(JSON.stringify(query)).digest('hex');
  const cached = await cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    await cache.set(requestId, data);
    queue.add(requestId, query);

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
