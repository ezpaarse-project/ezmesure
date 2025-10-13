const HarvestsService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

const { schema, includableFields } = require('../../entities/harvest.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

/**
  * @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
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

const cache = new Map();

async function computeInstitutionsMatrix(id, query) {
  const data = { requestedAt: new Date() };

  try {
    cache.set(id, data);

    const {
      'period:from': from,
      'period:to': to,
    } = query;

    const harvests = new HarvestsService();
    const institutions = new InstitutionsService();

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
    const rows = await institutions.findMany({ where: { id: { in: matrix.headers.rows } } });

    // Resolve unharvested
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

exports.getInstitutionsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const requestId = `institutions:${JSON.stringify(query)}`;
  const cached = cache.get(requestId);

  if (!cached) {
    // Don't await promise so it runs in the background
    computeInstitutionsMatrix(requestId, query);

    ctx.type = 'json';
    ctx.status = 425;
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

async function computeEndpointsMatrix(id, query) {
  const data = { requestedAt: new Date() };

  try {
    cache.set(id, data);

    const {
      'period:from': from,
      'period:to': to,
    } = query;

    const harvests = new HarvestsService();
    const endpoints = new EndpointsService();

    // Generate matrix
    const matrix = await harvests.getMatrix(
      (harvest) => harvest.credentials.endpointId,
      (harvest) => harvest.reportId,
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
    const rows = await endpoints.findMany({ where: { id: { in: matrix.headers.rows } } });

    // Cache matrix
    data.generatedAt = new Date();
    data.validUntil = new Date(data.generatedAt.getTime() + MATRIX_CACHE_DURATION);
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

exports.getEndpointsMatrix = async (ctx) => {
  const { retryCode = 202, ...query } = ctx.request.query;

  const requestId = `endpoints:${JSON.stringify(query)}`;
  const cached = cache.get(requestId);

  if (!cached) {
    // Don't await promise so it runs in the background
    computeEndpointsMatrix(requestId, query);

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
