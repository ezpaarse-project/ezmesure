// @ts-check
const { CronJob } = require('cron');
const appConfig = require('config');

const HarvestJobsService = require('../../entities/harvest-job.service');

const { appLogger } = require('../logger');
const { client: prisma } = require('../prisma');

const config = appConfig.get('counter.deleteJobs');

/**
 * Delete Harvest Jobs and Harvest Sessions marked as soft deleted (`deletedAt != null`)
 */
async function deleteMarkedJobsAndSessions() {
  // Delete jobs that are marked as deleted, or orphans (because credentials were deleted)
  const jobs = await prisma.harvestJob.deleteMany({ where: HarvestJobsService.whereSoftDeleted });
  appLogger.info(`[harvest-job][delete-job] Deleted [${jobs.count}] jobs`);

  // Sessions are deleted after jobs to avoid errors
  const sessions = await prisma.harvestSession.deleteMany({
    where: {
      // As session's deletedAt is one of the conditions for jobs,
      // we just need to clean empty sessions (even if not marked as delete)
      jobs: { none: {} },
    },
  });
  appLogger.info(`[harvest-job][delete-job] Deleted [${sessions.count}] sessions`);
}

async function startJobDeletion() {
  const job = CronJob.from({
    cronTime: config.schedule,
    runOnInit: true,
    onTick: async () => {
      appLogger.verbose('[harvest-job][delete-job] Starting jobs deletion');
      try {
        await deleteMarkedJobsAndSessions();
        appLogger.verbose('[harvest-job][delete-job] Jobs deletion ended');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(`${error}`);
        appLogger.error(`[harvest-job][delete-job] Failed to clean: ${err.message}`);
      }
    },
  });

  job.start();
}

module.exports = {
  startJobDeletion,
};
