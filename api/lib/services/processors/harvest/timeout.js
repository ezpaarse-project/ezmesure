const HarvestJobService = require('../../../entities/harvest-job.service');
const LogService = require('../../../entities/log.service');

const { appLogger } = require('../../logger');

/**
 * Exit process
 *
 * @param {Job} job - The BullMQ jobb
 * @param {string} reason Reason for exit
 * @param {number} exitCode Exit code
 */
function exit(job, reason, exitCode) {
  switch (reason) {
    case 'timeout':
      process.send?.({ cmd: 'failed', value: { message: 'Job timed out', code: 'E_JOB_TIMEOUT' } });
      break;
    case 'cancel':
      job.discard();
      break;
    default:
  }
  process.exit(exitCode ?? 1);
}

/**
 * Prepare job timeout
 *
 * @param {Job} job - The BullMQ jobb
 * @param {JobTask | undefined} task - The HarvestJob associated to the BullMQ job Current task
 */
module.exports = function prepareTimeout(job, task) {
  const jobTimeout = Number.isInteger(job?.data?.timeout) ? job.data.timeout : 600;

  const timeoutHandler = () => {
    appLogger.error(`[Harvest Job #${job?.id}] Timeout of ${jobTimeout}s exceeded, killing process`);

    if (!task) {
      exit(job, 'timeout', 1);
      return; // Process was already killed
    }

    HarvestJobService.$transaction(async (harvestJobService) => {
      const logService = new LogService(harvestJobService);

      // Try to gracefully fail
      await Promise.all([
        harvestJobService.finish(task, { status: 'failed' }),
        logService.log(task.id, 'error', `Timeout of ${jobTimeout}s exceeded`),
      ]);
    }).finally(() => {
      exit(job, 'timeout', 1);
    });

    // Kill process if it's taking too long to gracefully stop
    setTimeout(() => {
      exit(job, 'timeout', 1);
    }, 3000);
  };

  const exitHandler = (exitCode) => {
    appLogger.debug(`[Harvest Job #${job?.id}] Received SIGTERM, discarding job and exiting with code ${exitCode}`);

    // Try to gracefully fail
    HarvestJobService.$transaction(async (harvestJobService) => {
      if (!task) {
        return;
      }

      const logService = new LogService(harvestJobService);

      await Promise.all([
        harvestJobService.finish(task, { status: 'cancelled' }),
        logService.log(task.id, 'error', 'The task was cancelled'),
      ]);
    }).finally(() => exit(job, 'cancel', exitCode));

    // Kill process if it's taking too long to gracefully stop
    setTimeout(() => { exit(job, 'cancel', exitCode); }, 3000);
  };

  process.on('SIGTERM', (exitCode) => exitHandler(exitCode));

  let timeoutId;
  return {
    start: () => {
      timeoutId = setTimeout(() => timeoutHandler(), jobTimeout * 1000);
    },
    reset: () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => timeoutHandler(), jobTimeout * 1000);
    },
    end: () => {
      clearTimeout(timeoutId);
      process.removeListener('SIGTERM', (exitCode) => exitHandler(exitCode));
    },
  };
};
