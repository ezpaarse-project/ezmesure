const HarvestsService = require('../../entities/harvest.service');

/**
  * @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
 */

exports.getHarvests = async (ctx) => {
  const {
    from,
    to,
    reportId,
    size,
    sort,
    order = 'asc',
    page = 1,
  } = ctx.request.query;

  /** @type {HarvestFindManyArgs} */
  const options = {
    take: Number.isInteger(size) ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    orderBy: sort ? { [sort]: order } : undefined,
    where: {
      reportId,
    },
  };

  if (from || to) {
    options.where.period = { gte: from, lte: to };
  }

  const harvestsService = new HarvestsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await harvestsService.findMany(options);
};
