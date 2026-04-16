const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../utils/memory-queue');

const { appLogger } = require('../../services/logger');

const HarvestsService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;

const matrixManager = {
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
        data = matrixManager.cache.get(id) ?? {};

        appLogger.verbose(`[harvest-matrix][sushi-endpoints.${query.endpointId}][${id}] Generating matrix...`);

        const {
          'period:from': from,
          'period:to': to,
          endpointId,
        } = query;

        const harvests = new HarvestsService();
        const institutions = new InstitutionsService();

        // Generate matrix
        const matrix = await harvests.getMatrix(
          (harvest) => harvest.credentials.institutionId,
          (harvest) => harvest.reportId,
          {
            where: {
              period: { gte: from, lte: to },
              credentials: {
                endpointId,
              },
            },
            include: {
              credentials: {
                select: { institutionId: true },
              },
            },
          },
        );

        // Resolve headers
        appLogger.verbose(`[harvest-matrix][sushi-endpoints.${query.endpointId}][${id}] Resolving headers...`);
        const rows = await institutions.findMany({ where: { id: { in: matrix.headers.rows } } });

        // Cache matrix
        appLogger.verbose(`[harvest-matrix][sushi-endpoints.${query.endpointId}][${id}] Caching matrix for [${MATRIX_CACHE_DURATION}ms]...`);
        data.generatedAt = new Date();
        data.validUntil = new Date(data.generatedAt.getTime() + MATRIX_CACHE_DURATION);
        data.matrix = {
          ...matrix,
          headers: {
            columns: matrix.headers.columns,
            rows,
          },
        };

        matrixManager.cache.set(id, data);
      } catch (error) {
        appLogger.error(`[harvest-matrix][sushi-endpoints.${query.endpointId}][${id}] Something happened while generating matrix: ${error}`);
        // Cache error
        data.error = error;
        matrixManager.cache.set(id, data);
      } finally {
        // Delete cache when it expires
        setTimeout(() => {
          appLogger.verbose(`[harvest-matrix][sushi-endpoints.${query.endpointId}][${id}] Clearing cache entry`);
          matrixManager.cache.delete(id);
        }, MATRIX_CACHE_DURATION);
      }
    },
  ),
};

exports.getMatrix = async (ctx) => {
  const { endpointId } = ctx.params;

  const { retryCode = 202, ...query } = ctx.request.query;
  query.endpointId = endpointId;

  const requestId = matrixManager.createId(query);
  const cached = matrixManager.cache.get(requestId);

  if (!cached) {
    const data = { requestedAt: new Date() };

    matrixManager.cache.set(requestId, data);
    matrixManager.queue.add(requestId, query);

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
