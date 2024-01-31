const HarvestsJobsService = require('../../entities/harvest-job.service');
const HarvestRequestService = require('../../entities/harvest-request.service');
const prisma = require('../../services/prisma');
const { REPORT_IDS } = require('../../services/sushi');

const { propsToPrismaInclude, propsToPrismaSort } = require('../utils');

const includableFields = ['credentials', 'credentials.institution', 'credentials.endpoint'];
exports.includableFields = includableFields;

/**
  * @typedef {import('@prisma/client').Prisma.HarvestJobFindManyArgs} HarvestJobFindManyArgs
 */

exports.getRequests = async (ctx) => {
  const {
    size,
    // sort,
    // order = 'asc',
    page = 1,
  } = ctx.request.query;

  const options = {};

  const requests = await HarvestRequestService.findMany({
    ...options,
    // orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
  });

  ctx.set('X-Total-Count', await HarvestRequestService.count(options));
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = requests;
};

exports.getJobs = async (ctx) => {
  const { harvestId } = ctx.params;
  const {
    from,
    to,
    reportType,
    vendor,
    institution,
    status,
    tags,
    size,
    sort,
    order = 'asc',
    page = 1,
    include: propsToInclude,
  } = ctx.request.query;

  /** @type {HarvestJobFindManyArgs} */
  const options = {
    where: {
      reportType,
      harvestId,
      status,
    },
  };

  if (from && to) {
    options.where.endDate = { gte: from };
    options.where.beginDate = { lte: to };
  }

  if (institution || vendor || tags) {
    options.where.credentials = { institutionId: institution };

    if (vendor) {
      options.where.credentials.endpoint = { id: vendor };
    }

    if (tags) {
      options.where.credentials.tags = { has: tags };
    }
  }

  const harvests = await HarvestsJobsService.findMany({
    ...options,
    orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    include: propsToPrismaInclude(propsToInclude, includableFields),
  });

  ctx.set('X-Total-Count', await HarvestsJobsService.count(options));
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = harvests;
};

exports.getJobsMeta = async (ctx) => {
  const { harvestId } = ctx.params;
  /** @type {HarvestJobFindManyArgs} */
  const options = {
    where: { harvestId },
    select: {
      credentials: {
        select: {
          endpoint: {
            select: {
              id: true,
              vendor: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
              acronym: true,
            },
          },
          tags: true,
        },
      },
    },
  };
  const harvests = await HarvestsJobsService.findMany(options);

  const meta = {
    vendors: new Map(),
    institutions: new Map(),
    tags: new Set(),
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const harvest of harvests) {
    meta.vendors.set(harvest.credentials.endpoint.id, harvest.credentials.endpoint);
    meta.institutions.set(harvest.credentials.institution.id, harvest.credentials.institution);
    meta.tags.add(...harvest.credentials.tags);
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    vendors: [...meta.vendors.values()],
    institutions: [...meta.institutions.values()],
    tags: [...meta.tags],
    reportTypes: REPORT_IDS,
    statuses: Object.values(prisma.enums.HarvestJobStatus),
  };
};
