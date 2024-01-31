// @ts-check

const harvestJobPrisma = require('../services/prisma/harvest-job');
const HarvestRequest = require('../models/HarvestRequest');

module.exports = class HarvestRequestService {
  static async findMany(params) {
    const harvestsJobs = await harvestJobPrisma.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        credentials: true,
      },
    });

    const requests = new Map();
    // eslint-disable-next-line no-restricted-syntax
    for (const job of harvestsJobs) {
      const request = requests.get(job.harvestId) || new HarvestRequest(job);

      request.addJob(job);

      requests.set(job.harvestId, request);
    }

    // Apply pagination
    const start = params.skip;
    const end = params.take && (params.skip ?? 0) + params.take;

    return Array.from(requests.values())
      .slice(start, end)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  static async count(params) {
    const harvestIds = await harvestJobPrisma.groupBy({ by: 'harvestId' });
    return harvestIds.length;
  }
};
