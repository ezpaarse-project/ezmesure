const { differenceInMilliseconds } = require('date-fns');
const harvestJobPrisma = require('../services/prisma/harvest-job');

module.exports = class HarvestRequestService {
  static async findMany(params) {
    const harvestsJobs = await harvestJobPrisma.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const requests = new Map();
    // eslint-disable-next-line no-restricted-syntax
    for (const job of harvestsJobs) {
      const request = requests.get(job.harvestId) || {
        id: job.harvestId,
        beginDate: job.beginDate,
        endDate: job.endDate,
        createdAt: job.createdAt,
        runningTime: 0,
        jobCount: 0,
        statuses: {},
      };

      request.jobCount += 1;
      request.statuses[job.status] = (request.statuses[`${job.status}`] || 0) + 1;

      const isActive = request.statuses.waiting
        || request.statuses.delayed
        || request.statuses.running;

      if (!isActive) {
        const diffMs = differenceInMilliseconds(job.updatedAt, request.createdAt);
        if (diffMs > request.runningTime) {
          request.runningTime = diffMs;
        }
      } else {
        request.runningTime = differenceInMilliseconds(new Date(), request.createdAt);
      }

      requests.set(job.harvestId, request);
    }

    const start = params.skip;
    const end = params.take && (params.skip ?? 0) + params.take;

    return [...requests.values()]
      .slice(start, end);
  }

  static async count(params) {
    const harvestIds = await harvestJobPrisma.groupBy({ by: 'harvestId' });
    return harvestIds.length;
  }
};
