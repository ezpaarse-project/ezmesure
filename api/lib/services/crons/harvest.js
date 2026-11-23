// @ts-check
const { subDays, endOfDay, formatDistanceToNow } = require('date-fns');
const { CronJob } = require('cron');
const config = require('config');

const { HarvestJobStatus } = require('../../.prisma/client.mts');
const HarvestsService = require('../../entities/harvest.service');
const HarvestJobsService = require('../../entities/harvest-job.service');

const { harvestQueue } = require('../jobs');
const { appLogger } = require('../logger');

const harvestConfig = config.get('jobs.harvest');

async function cancelPendingHarvest() {
  const harvestsService = new HarvestsService();
  const harvestJobService = new HarvestJobsService();

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

  const hasBeenCancelled = await Promise.all(
    harvests.map(async (harvest) => {
      try {
        if (!harvest.harvestedById) {
          // If the harvest state is active but no job has been linked to it, mark it as interrupted
          await harvestsService.update({
            data: { status: HarvestJobStatus.interrupted },
            where: {
              credentialsId_reportId_period: {
                credentialsId: harvest.credentialsId,
                reportId: harvest.reportId,
                period: harvest.period,
              },
            },
          });
          return true;
        }

        // If the job is still in the queue, it means it is still running so don't cancel it
        const job = await harvestQueue.getJob(harvest.harvestedById);
        if (job) {
          appLogger.warn(`[harvest][pending-cancel] ${harvest.status} job (${job.id}) still in queue while started ${formatDistanceToNow(harvest.harvestedAt, { addSuffix: true })}`);
          return false;
        }

        // Mark the harvest job as interrupted, the hooks will update the harvest state
        await harvestJobService.update({
          where: { id: harvest.harvestedById },
          data: { status: HarvestJobStatus.interrupted },
        });
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`${error}`);
        appLogger.error(`[harvest][pending-cancel] Failed to clean job (${harvest.harvestedById}): ${err.message}`);
        return false;
      }
    }),
  );

  const count = hasBeenCancelled.filter((value) => !!value).length;
  appLogger.info(`[harvest][pending-cancel] Marked ${count} jobs as interrupted`);
}

async function startCancelCron() {
  const job = CronJob.from({
    cronTime: harvestConfig.cancelSchedule,
    runOnInit: true,
    onTick: async () => {
      const start = Date.now();
      appLogger.verbose('[harvest][pending-cancel] Starting cleanup');

      try {
        await cancelPendingHarvest();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`${error}`);
        appLogger.error(`[harvest][pending-cancel] Failed to clean: ${err.message}`);
      }

      appLogger.verbose(`[harvest][pending-cancel] Cleaned | took: ${Date.now() - start}ms`);
    },
  });

  job.start();
}

module.exports = {
  startCancelCron,
};
