// @ts-check

const { appLogger } = require('../../../logger');

const HarvestJobService = require('../../../../entities/harvest-job.service');

const HarvestError = require('../HarvestError');

/**
 * Prepare harvesting
 *
 * @param {import('..').ProcessorStepParam} params
 */
module.exports = async function process(params) {
  const { job, task: { data: task }, timeout } = params;
  const { id: jobId = '' } = job;

  const harvestJobService = new HarvestJobService();

  if (job.attemptsMade > 1) {
    appLogger.verbose(`[Harvest Job #${job?.id}] New attempt (total: ${job.attemptsMade})`);
    await harvestJobService.log(jobId, 'info', `New attempt (total: ${job.attemptsMade})`);
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
  await harvestJobService.log(jobId, 'info', 'Sushi import task initiated');
  await harvestJobService.log(jobId, 'info', `Requested report type: ${reportType?.toUpperCase?.()}`);
  timeout.reset();

  if (beginDate || endDate) {
    await harvestJobService.log(jobId, 'info', `Requested period: from ${beginDate || endDate} to ${endDate || beginDate}`);
  } else {
    await harvestJobService.log(jobId, 'info', 'No period requested, defaulting to last month');
  }
  timeout.reset();

  await harvestJobService.update({
    where: { id: task.id },
    // @ts-ignore
    data: {
      ...task,
      result: task.result || undefined,
      // Don't update the following
      logs: undefined,
      steps: undefined,
      updatedAt: undefined,
      session: undefined,
      credentials: undefined,
    },
  });
};
