const { HarvestJobStatus } = require('@prisma/client');
const { subDays, endOfDay, formatDistanceToNow } = require('date-fns');
const { CronJob } = require('cron');
const config = require('config');

const HarvestsService = require('../entities/harvest.service');
const HarvestJobsService = require('../entities/harvest-job.service');

const { harvestQueue } = require('./jobs');
const { appLogger } = require('./logger');

const harvestConfig = config.get('jobs.harvest');

function cancelPendingHarvest() {
  return HarvestsService.$transaction(async (harvestsService) => {
    const harvestJobService = new HarvestJobsService(harvestsService);

    // Get all pending/running harvests older than 1 day (rounded)
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
          lte: endOfDay(subDays(new Date(), 1)),
        },
      },
    });

    await Promise.all(
      harvests.map(async (harvest) => {
        if (!harvest.harvestedById) {
          // If the harvest state is active but no job has been linked to it, mark it as interrupted
          return harvestsService.update({
            data: { status: HarvestJobStatus.interrupted },
            where: {
              credentialsId_reportId_period: {
                credentialsId: harvest.credentialsId,
                reportId: harvest.reportId,
                period: harvest.period,
              },
            },
          });
        }

        // If the job is still in the queue, it means it is still running so don't cancel it
        const job = await harvestQueue.getJob(harvest.harvestedById);
        if (job) {
          appLogger.warn(`[harvest-pending-cancel] ${harvest.status} job (${job.id}) still in queue while started ${formatDistanceToNow(harvest.harvestedAt, { addSuffix: true })}`);
          return;
        }

        // Mark the harvest job as interrupted, the hooks will update the harvest state
        await harvestJobService.update({
          where: { id: harvest.harvestedById },
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
