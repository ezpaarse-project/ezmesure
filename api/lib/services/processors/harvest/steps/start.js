// @ts-check

const { appLogger } = require('../../../logger');

const HarvestJobService = require('../../../../entities/harvest-job.service');
const LogService = require('../../../../entities/log.service');

const HarvestError = require('../HarvestError');

/**
 * Prepare harvesting
 *
 * @param {import('..').ProcessorStepParam} params
 */
module.exports = async function process(params) {
  const { job, task: { data: task }, timeout } = params;
  const { id: jobId = '' } = job;

  const logService = new LogService();
  const harvestJobService = new HarvestJobService();

  if (job.attemptsMade > 1) {
    appLogger.verbose(`[Harvest Job #${job?.id}] New attempt (total: ${job.attemptsMade})`);
    await logService.log(jobId, 'info', `New attempt (total: ${job.attemptsMade})`);
    timeout.reset();
  }

  const {
    credentials,
    credentialsId,
    reportType,
    beginDate,
    endDate,
  } = task;

  if (!credentials) {
    throw new HarvestError(`SUSHI item [${credentialsId}] not found`);
  }

  task.status = 'running';
  task.startedAt = new Date();
  await logService.log(jobId, 'info', 'Sushi import task initiated');
  await logService.log(jobId, 'info', `Requested report type: ${reportType?.toUpperCase?.()}`);
  timeout.reset();

  if (beginDate || endDate) {
    await logService.log(jobId, 'info', `Requested period: from ${beginDate || endDate} to ${endDate || beginDate}`);
  } else {
    await logService.log(jobId, 'info', 'No period requested, defaulting to last month');
  }
  timeout.reset();

  await harvestJobService.update({
    where: { id: task.id },
    // @ts-ignore
    data: {
      ...task,
      updatedAt: undefined,
      session: undefined,
      result: task.result || undefined,
      credentials: undefined,
    },
  });
};
