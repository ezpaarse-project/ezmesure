const config = require('config');
const path = require('path');
const Queue = require('bull');

const { appLogger } = require('./logger');
const Task = require('../models/Task');

const harvestConcurrency = Number.parseInt(config.get('jobs.harvest.concurrency'), 10);
const redisConfig = config.get('redis');
const logPrefix = '[Harvest Queue]';

const harvestQueue = new Queue('sushi-harvest', { redis: redisConfig });
harvestQueue.process(harvestConcurrency, path.resolve(__dirname, 'processors', 'harvest.js'));

async function checkTask(taskId, jobId) {
  if (!taskId) { return; }

  const task = await Task.findById(taskId);

  if (!task || task.isDone()) { return; }

  appLogger.verbose(`${logPrefix} Job [${jobId}] stopped unexpectedly, setting task status to [failed]...`);
  task.fail(['The task stopped unexpectedly']);

  try {
    await task.save();
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

harvestQueue
  .on('waiting', (jobId) => { appLogger.verbose(`${logPrefix} Job [${jobId}] is pending`); })
  .on('active', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] has started`); })
  .on('stalled', (job) => { appLogger.error(`${logPrefix} Job [${job?.id}] stalled`); })
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
  })
  .on('lock-extension-failed', (job, err) => {
    // A job failed to extend lock. This will be useful to debug redis
    // connection issues and jobs getting restarted because workers
    // are not able to extend locks.
    appLogger.verbose(`${logPrefix} Job [${job?.id}] failed to extend lock`);
    appLogger.verbose(err);
  })
  .on('error', (error) => {
    appLogger.error(`${logPrefix} An error occurred in the job queue`);
    appLogger.error(error.message);
    appLogger.error(error.stack);
  })
  .on('paused', () => { appLogger.verbose(`${logPrefix} Queue has been paused`); })
  .on('resumed', () => { appLogger.verbose(`${logPrefix} Queue has been resumed`); })
  .on('cleaned', (jobs, type) => { appLogger.verbose(`${logPrefix} ${jobs.length} old jobs of type [${type}] have been cleaned`); })
  .on('drained', () => { appLogger.verbose(`${logPrefix} Queue has no more pending jobs`); })
  .on('removed', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] removed`); });

module.exports = {
  harvestQueue,
};
