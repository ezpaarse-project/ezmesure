const HarvestsService = require('../../entities/harvest.service');
const { schema, includableFields } = require('../../entities/harvest.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');

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
