// @ts-check

/**
 * The processor lives in a separate process, so we must register hooks here
 */
require('../../../hooks');

const config = require('config');
const { DelayedError } = require('bullmq');
const {
  addSeconds,
  isValid: dateIsValid,
  isFuture: dateIsFuture,
} = require('date-fns');

const HarvestJobService = require('../../../entities/harvest-job.service');
const LogService = require('../../../entities/log.service');
const SushiEndpointService = require('../../../entities/sushi-endpoints.service');

const { appLogger } = require('../../logger');
const { ERROR_CODES } = require('../../sushi');

const HarvestError = require('./HarvestError');
const prepareTimeout = require('./timeout');
const prepareTask = require('./task');

const startProcessStep = require('./steps/start');
const downloadProcessStep = require('./steps/download');
const validateProcessStep = require('./steps/validate');
const checkIndexProcessStep = require('./steps/check-index');
const insertProcessStep = require('./steps/insert');

/* eslint-disable max-len */
/**
 * @typedef {import('./task').JobTask} JobTask
 * @typedef {import('bullmq').Job} Job
 * @typedef {import('bullmq').Processor} Processor
 *
 * @typedef {Exclude<Awaited<ReturnType<import('./task')>>, null>} TaskManager
 */

/**
 * @typedef {Object} ProcessorStepParam
 * @property {Job} job - The BullMQ job
 * @property {TaskManager} task - The manager of the HarvestJob associated to the BullMQ job
 * @property {ReturnType<import('./timeout')>} timeout - The manager of the timeout associated to the BullMQ job
 * @property {Object} data - Data of other steps
*/
/* eslint-enable max-len */

const busyBackoffDuration = parseInt(config.get('jobs.harvest.busyBackoffDuration'), 10);
const deferralBackoffDuration = parseInt(config.get('jobs.harvest.deferralBackoffDuration'), 10);
const maxDeferrals = parseInt(config.get('jobs.harvest.maxDeferrals'), 10);

/**
 * Defer job by a given number of seconds
 *
 * @param {Job} job - The BullMQ job
 * @param {JobTask} task - The HarvestJob associated to the BullMQ job
 * @param {number} timestamp - Timestamp where the job should be moved back to the waiting list
 * @param {string | undefined} lockToken - The job lock token
 *
 * @throws {HarvestError} If the maximum number of deferrals has been reached
 * @throws {DelayedError} When the job was deferred
 */
async function deferJob(job, task, timestamp, lockToken, options = {}) {
  const {
    incrementCounter = true,
  } = options;
  let timesDelayed = job?.data?.timesDelayed || 0;

  if (incrementCounter) {
    timesDelayed += 1;
  }

  await HarvestJobService.$transaction(async (harvestJobService) => {
    const logService = new LogService(harvestJobService);

    if (timesDelayed <= maxDeferrals) {
      return harvestJobService.finish(task, { status: 'delayed' });
    }

    await Promise.all([
      harvestJobService.finish(task, { status: 'failed', errorCode: ERROR_CODES.maxDeferralsExceeded }),
      logService.log(task.id, 'error', 'Maximum deferral times exceeded'),
    ]);
    throw new HarvestError('Maximum number of download deferral exceeded');
  });

  await job.updateData({ ...job.data, timesDelayed });
  await job.moveToDelayed(timestamp, lockToken);
  throw new DelayedError();
}

/**
 * Delay job if endpoint is disabled
 *
 * @param {Job} job - The BullMQ job
 * @param {JobTask} task - The HarvestJob associated to the BullMQ job
 * @param {string | undefined} lockToken Token for the current job
 *
 * @throws {HarvestError} If the maximum number of deferrals has been reached
 * @throws {DelayedError} When the job was deferred
 */
async function delayIfEndpointDisabled(job, task, lockToken) {
  const sushiEndpointService = new SushiEndpointService();

  const endpoint = task.credentials?.endpoint;
  if (!endpoint?.id || !endpoint?.disabledUntil) {
    return;
  }

  const disabledUntil = new Date(endpoint?.disabledUntil);
  if (!dateIsValid(disabledUntil) || !dateIsFuture(disabledUntil)) {
    await sushiEndpointService.update({
      where: { id: endpoint.id },
      data: { disabledUntil: null },
    });
    return;
  }

  appLogger.info(`[Harvest Job #${job?.id}] Endpoint [${endpoint?.vendor || endpoint?.id}] is currently disabled, job will be postponed`);
  await deferJob(job, task, disabledUntil.getTime(), lockToken, { incrementCounter: false });
}

/**
 *
 * @param {Job} job - The BullMQ job
 * @param {JobTask} task - The HarvestJob associated to the BullMQ job
 * @param {HarvestError} err
 * @param {*} lockToken
 * @returns
 */
async function handleErrorTypes(job, task, err, lockToken) {
  const endpoint = task.credentials?.endpoint;

  if (err.type === 'delayed') {
    appLogger.verbose(`[Harvest Job #${job?.id}] Deferring task [${task.id}] by ${deferralBackoffDuration} seconds`);

    const deferredDate = addSeconds(Date.now(), deferralBackoffDuration);
    await deferJob(job, task, deferredDate.getTime(), lockToken);
    return; // Job was deferred and an error was thrown
  }

  if (err.type === 'busy') {
    appLogger.verbose(`[Harvest Job #${job?.id}] Disabling endpoint [${endpoint?.vendor || endpoint?.id}] for ${busyBackoffDuration} seconds`);
    const disabledUntil = addSeconds(Date.now(), busyBackoffDuration);

    await (new SushiEndpointService()).update({
      where: { id: endpoint?.id },
      data: { disabledUntil },
    });

    await deferJob(job, task, disabledUntil.getTime(), lockToken);
    // Job was deferred and an error was thrown
  }
}

/** @type {Processor} */
module.exports = async function handle(job, lockToken) {
  await job.updateData({ ...job.data, pid: process.pid });

  const { taskId } = job?.data || {};

  appLogger.verbose(`[Harvest Job #${job?.id}] Fetching data of task [${taskId}]`);
  const task = await prepareTask(job);

  if (!task) {
    appLogger.error(`[Harvest Job #${job?.id}] Associated task [${taskId || 'n/a'}] does not exist, removing job`);
    return job.remove(); // throw error ?!
  }

  const timeout = prepareTimeout(job, task);
  timeout.start();

  await delayIfEndpointDisabled(job, task.data, lockToken);
  timeout.reset();

  // Just a little delay to avoid spamming too fast when harvesting a single platform
  await new Promise((resolve) => { setTimeout(resolve, 500); });

  /** @type {ProcessorStepParam} */
  const processorStepParam = {
    job,
    task,
    timeout,
    data: {},
  };

  try {
    await startProcessStep(processorStepParam);
    timeout.reset();

    await downloadProcessStep(processorStepParam);
    timeout.reset();

    await validateProcessStep(processorStepParam);
    timeout.reset();

    await checkIndexProcessStep(processorStepParam);
    timeout.reset();

    await insertProcessStep(processorStepParam);
    timeout.reset();
  } catch (err) {
    timeout.end();

    await handleErrorTypes(job, task.data, err, lockToken);

    appLogger.error(`Failed to import sushi report [${task.data.credentials?.id}]`);
    task.logs.add('error', err.message);

    if (err instanceof HarvestError) {
      if (err.cause instanceof Error) {
        task.logs.add('error', err.cause.message);
        appLogger.error(err.cause.message);
        appLogger.error(err.cause.stack);
      }
    } else {
      appLogger.error(err.message);
      appLogger.error(err.stack);
    }

    try {
      await task.finish({ status: 'failed' });
    } catch (e) {
      appLogger.error(`Failed to save sushi task ${task.id}`);
      appLogger.error(e.message);
    }

    throw err;
  }

  timeout.end();
  return task.data.result;
};
