const { createHash } = require('node:crypto');

const InMemoryQueue = require('../../utils/memory-queue');
const { createCache } = require('../../utils/cache-manager');

const { appLogger } = require('../../services/logger');

const HarvestService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

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

      appLogger.verbose(`[harvest-matrix][harvest-sessions.${query.sessionId}][${id}] Generating matrix...`);

      const { sessionId } = query;

      const harvests = new HarvestService();
      const institutions = new InstitutionsService();
      const endpoints = new EndpointsService();

      // Generate matrix
      const matrix = await harvests.getMatrix(
        (harvest) => harvest.credentials.endpointId,
        (harvest) => harvest.credentials.institutionId,
        {
          where: {
            harvestedBy: {
              sessionId,
            },
          },
          include: {
            credentials: {
              select: { endpointId: true, institutionId: true },
            },
          },
        },
      );

      // Resolve headers
      appLogger.verbose(`[harvest-matrix][harvest-sessions.${query.sessionId}][${id}] Resolving headers...`);
      const [columns, rows] = await Promise.all([
        institutions.findMany({
          where: { id: { in: matrix.headers.columns } },
          orderBy: { name: 'asc' },
        }),
        endpoints.findMany({ where: { id: { in: matrix.headers.rows } } }),
      ]);

      // Aggregate institutions into a one line matrix
      // cause we use cells instead of harvest (for performance reasons)
      // we need to aggregate manually
      appLogger.verbose(`[harvest-matrix][harvest-sessions.${query.sessionId}][${id}] Aggregating institutions...`);
      const summary = new Map();
      // eslint-disable-next-line no-restricted-syntax
      for (const row of matrix.rows) {
        // eslint-disable-next-line no-restricted-syntax
        for (const cell of row.cells) {
          if (cell.total <= 0) {
            // eslint-disable-next-line no-continue
            continue;
          }

          const entry = summary.get(cell.columnId) ?? {};

          entry.id = cell.columnId;

          // Keep last harvestedAt
          if ((entry.harvestedAt ?? 0) <= (cell.harvestedAt ?? 0)) {
            entry.harvestedAt = cell.harvestedAt;
          }

          // Aggregate counter versions
          entry.counterVersions = new Set([
            ...(entry.counterVersions ?? []),
            ...(cell.counterVersions ?? []),
          ]);
          // Aggregate errors
          entry.errors = new Set([
            ...(entry.errors ?? []),
            ...(cell.errors ?? []),
          ]);
          // Aggregate report ids
          entry.reportIds = new Set([
            ...(entry.reportIds ?? []),
            ...(cell.reportIds ?? []),
          ]);

          // Aggregate period
          entry.period = entry.period ?? cell.period ?? {};
          if ((entry.period?.beginDate ?? 0) >= (cell.period?.beginDate ?? 0)) {
            entry.period.beginDate = cell.period?.beginDate ?? 0;
          }
          if ((entry.period?.endDate ?? 0) <= (cell.period?.endDate ?? 0)) {
            entry.period.endDate = cell.period?.endDate ?? 0;
          }

          // Aggregate counts into one cell
          entry.total = (entry.total ?? 0) + cell.total;
          entry.counts = entry.counts ?? {};
          // eslint-disable-next-line no-restricted-syntax
          for (const [status, count] of Object.entries(cell.counts ?? {})) {
            entry.counts[status] = (entry.counts[status] ?? 0) + count;
          }

          entry.items = {
            inserted: (entry.items?.inserted ?? 0) + (cell.items?.inserted ?? 0),
            updated: (entry.items?.updated ?? 0) + (cell.items?.updated ?? 0),
            failed: (entry.items?.failed ?? 0) + (cell.items?.failed ?? 0),
          };

          summary.set(cell.columnId, entry);
        }
      }
      // Get status of each summary cell
      // eslint-disable-next-line no-restricted-syntax
      for (const [, entry] of summary) {
        // Define status based on counts
        ([[entry.status] = []] = Object.entries(entry.counts)
          .sort(([, aValue], [, bValue]) => bValue - aValue));

        // Array-ify errors and counter versions
        entry.counterVersions = Array.from(entry.counterVersions).sort();
        entry.errors = Array.from(entry.errors).sort();
        entry.reportIds = Array.from(entry.reportIds).sort();
      }

      // Cache matrix
      appLogger.verbose(`[harvest-matrix][harvest-sessions.${query.sessionId}][${id}] Caching matrix for [${CACHE_DURATION}ms]...`);
      data.generatedAt = new Date();
      data.validUntil = new Date(data.generatedAt.getTime() + CACHE_DURATION);
      data.summary = Array.from(summary.values());
      data.matrix = {
        ...matrix,
        headers: {
          columns,
          rows,
        },
        rows: matrix.rows
          // Sort cells by institution
          .map((row) => ({
            ...row,
            cells: row.cells.toSorted((cellA, cellB) => {
              const indexA = columns.findIndex((inst) => inst.id === cellA.columnId);
              const indexB = columns.findIndex((inst) => inst.id === cellB.columnId);
              return indexA - indexB;
            }),
          })),
      };
    } catch (error) {
      appLogger.error(`[harvest-matrix][harvest-sessions.${query.sessionId}][${id}] Something happened while generating matrix: ${error}`);
      // Cache error
      data.error = error;
    }
    await cache.set(id, data);
  },
);

exports.getMatrix = async (ctx) => {
  const { harvestId } = ctx.params;
  const { retryCode = 202 } = ctx.request.query;

  const query = { sessionId: harvestId };

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
