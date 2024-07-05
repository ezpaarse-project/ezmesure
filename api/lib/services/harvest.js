const { HarvestJobStatus } = require('@prisma/client');
const { subDays, formatDistanceToNow } = require('date-fns');
const { CronJob } = require('cron');
const config = require('config');

const HarvestsService = require('../entities/harvest.service');

const { harvestQueue } = require('./jobs');
const { appLogger } = require('./logger');

const harvestConfig = config.get('jobs.harvest');

function cancelPendingHarvest() {
  return HarvestsService.$transaction(async (harvestsService) => {
    // Get all pending/running harvests older than 1 day
    const harvests = await harvestsService.findMany({
      where: {
        status: {
          in: [
            HarvestJobStatus.waiting,
            HarvestJobStatus.delayed,
            HarvestJobStatus.running,
          ],
        },
        harvestedAt: {
          lte: subDays(new Date(), 1),
        },
      },
    });

    await Promise.all(
      harvests.map(async (harvest) => {
        // Check if the job is still in the queue
        const job = await harvestQueue.getJob(harvest.harvestedById);
        if (job) {
          appLogger.warn(`[harvest-pending-cancel] ${harvest.status} job (${job.id}) still in queue while started ${formatDistanceToNow(harvest.harvestedAt, { addSuffix: true })}`);
          return;
        }

        // Cancel the job otherwise
        await harvestsService.update({
          where: {
            credentialsId_reportId_period: {
              credentialsId: harvest.credentialsId,
              reportId: harvest.reportId,
              period: harvest.period,
            },
          },
          data: { status: HarvestJobStatus.interrupted },
        });
      }),
    );
  });
}

async function startCancelCron() {
  const job = CronJob.from({
    cronTime: harvestConfig.cancelSchedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[harvest-pending-cancel] Starting cleanup');
      try {
        await cancelPendingHarvest();
        appLogger.info('[harvest-pending-cancel] Cleaned');
      } catch (e) {
        appLogger.error(`[harvest-pending-cancel] Failed to clean: ${e.message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  startCancelCron,
};
