const { parseISO } = require('date-fns');
const LogService = require('../../entities/log.service');

const { propsToPrismaSort } = require('../utils');

/** @typedef {import('@prisma/client').Prisma.LogWhereInput} LogWhereInput */

exports.getAll = async (ctx) => {
  const { query = {} } = ctx.request;
  const {
    size,
    sort,
    order = 'asc',
    page = 1,
    jobId,
    level,
    from,
    to,
  } = query;

  /** @type {LogWhereInput} */
  const where = {
    jobId,
    level,
  };

  if (from || to) {
    where.date = {
      gte: from && parseISO(from),
      lte: to && parseISO(to),
    };
  }

  ctx.type = 'json';
  ctx.status = 200;

  const logService = new LogService();

  ctx.set('X-Total-Count', await logService.count({ where }));
  ctx.body = await logService.findMany({
    where,
    orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
  });
};
