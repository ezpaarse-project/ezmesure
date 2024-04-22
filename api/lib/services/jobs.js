const config = require('config');
const path = require('path');
const { Queue, Worker } = require('bullmq');

const { appLogger } = require('./logger');
const HarvestJobService = require('../entities/harvest-job.service');

const harvestConcurrency = Number.parseInt(config.get('jobs.harvest.concurrency'), 10);
const redisConfig = config.get('redis');
const logPrefix = '[Harvest Queue]';

const workerFile = path.resolve(__dirname, 'processors', 'harvest', 'index.js');

const harvestQueue = new Queue('sushi-harvest', { connection: redisConfig });
const harvestWorker = new Worker('sushi-harvest', workerFile, {
  connection: redisConfig,
  concurrency: harvestConcurrency,
});

async function checkTask(taskId, jobId) {
  if (!taskId) { return; }

  const harvestJobService = new HarvestJobService();

  const task = await harvestJobService.findUnique({ where: { id: taskId } });

  if (!task || HarvestJobService.isDone(task)) { return; }

  appLogger.verbose(`${logPrefix} Job [${jobId}] stopped unexpectedly, setting task from status [${task.status}] to [failed]...`);

  try {
    await harvestJobService.update(
      {
        where: { id: taskId },
        data: {
          status: 'failed',
          runningTime: task.startedAt ? Date.now() - task.startedAt.getTime() : 0,
          logs: { create: { level: 'error', message: 'The task stopped unexpectedly' } },
        },
      },
    );
  } catch (e) {
    appLogger.error(`${logPrefix} Task [${taskId}] could not be saved`);
  }
}

/**
 * Make sure that the associated task is marked as finished
 * and remove the job from the queue
 * @param {Object} job the job that has finished
 */
async function handleFinishedJob(job) {
  try {
    await checkTask(job?.data?.taskId, job?.id);
  } catch (e) {
    appLogger.error(`${logPrefix} Failed to check state of task [${job?.data?.taskId}]`);
    appLogger.error(e.message);
    appLogger.error(e.stack);
  }

  try {
    await job.remove();
  } catch (e) {
    appLogger.error(`${logPrefix} Failed to remove job [${job?.id}]`);
    appLogger.error(e.message);
    appLogger.error(e.stack);
  }
}

harvestWorker
  .on('active', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] has started`); })
  .on('stalled', (jobId) => { appLogger.error(`${logPrefix} Job [${jobId}] stalled`); })
  .on('drained', () => { appLogger.verbose(`${logPrefix} Queue has no more waiting jobs`); })
  .on('completed', (job) => {
    appLogger.verbose(`${logPrefix} Job [${job?.id}] completed`);
    handleFinishedJob(job);
  })
  .on('failed', (job, err) => {
    if (job?.isDiscarded?.()) {
      appLogger.error(`${logPrefix} Job [${job?.id}] has been cancelled`);
    } else if (err?.code !== 'E_JOB_TIMEOUT') {
      appLogger.error(`${logPrefix} Job [${job?.id}] failed`);
      appLogger.error(err.message);
      appLogger.error(err.stack);
    }

    handleFinishedJob(job);
  });

harvestQueue
  .on('error', (error) => {
    appLogger.error(`${logPrefix} An error occurred in the job queue`);
    appLogger.error(error.message);
    appLogger.error(error.stack);
  })
  .on('paused', () => { appLogger.verbose(`${logPrefix} Queue has been paused`); })
  .on('resumed', () => { appLogger.verbose(`${logPrefix} Queue has been resumed`); })
  .on('waiting', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] is waiting`); })
  .on('cleaned', (jobs, type) => { appLogger.verbose(`${logPrefix} ${jobs.length} old jobs of type [${type}] have been cleaned`); })
  .on('removed', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] removed`); });

module.exports = {
  harvestQueue,
};
