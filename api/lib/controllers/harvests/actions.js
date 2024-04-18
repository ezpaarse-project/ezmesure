const HarvestsService = require('../../entities/harvest.service');
const { includableFields } = require('../../entities/harvest.dto');

const { propsToPrismaSort, propsToPrismaInclude, queryToPrismaFilter } = require('../utils');

/**
  * @typedef {import('@prisma/client').Prisma.HarvestWhereInput} HarvestWhereInput
 */

exports.getHarvests = async (ctx) => {
  const {
    from,
    to,
    harvestedBefore,
    harvestedAfter,
    reportId,
    credentialsId,
    endpointId,
    institutionId,
    status,
    errorCode,
    tags,
    packages,
    size,
    sort,
    order = 'asc',
    page = 1,
    distinct: distinctFields,
    include: propsToInclude,
  } = ctx.request.query;

  /** @type {HarvestWhereInput} */
  const where = {
    reportId: queryToPrismaFilter(reportId),
    credentialsId: queryToPrismaFilter(credentialsId),
    status: queryToPrismaFilter(status),
    errorCode: queryToPrismaFilter(errorCode),
  };

  if (institutionId || endpointId || tags || packages) {
    where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      institutionId: queryToPrismaFilter(institutionId),
      tags: tags && { hasSome: queryToPrismaFilter(tags).in },
      packages: packages && { hasSome: queryToPrismaFilter(packages).in },
    };
  }

  if (from || to) {
    where.period = { gte: from, lte: to };
  }
  if (harvestedBefore || harvestedAfter) {
    where.harvestedAt = { gte: harvestedAfter, lte: harvestedBefore };
  }

  let distinct;
  if (distinctFields) {
    distinct = Array.isArray(distinctFields) ? distinctFields : distinctFields.split(',').map((s) => s.trim());
  }

  const harvestsService = new HarvestsService();

  ctx.set('X-Total-Count', await harvestsService.count({ where }));

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await harvestsService.findMany({
    include: propsToPrismaInclude(propsToInclude, includableFields),
    where,
    distinct,
    orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
  });
};
