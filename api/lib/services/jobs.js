const config = require('config');
const path = require('path');
const Queue = require('bull');

const { appLogger } = require('./logger');

const harvestConcurrency = Number.parseInt(config.get('jobs.harvest.concurrency'), 10);
const redisConfig = config.get('redis');
const logPrefix = '[Harvest Queue]';

const harvestQueue = new Queue('sushi-harvest', { redis: redisConfig });
harvestQueue.process(harvestConcurrency, path.resolve(__dirname, 'processors', 'harvest.js'));

harvestQueue
  .on('waiting', (jobId) => { appLogger.verbose(`${logPrefix} Job [${jobId}] is pending`); })
  .on('active', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] has started`); })
  .on('completed', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] completed`); })
  .on('stalled', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] stalled`); })
  .on('failed', (job, err) => {
    appLogger.verbose(`${logPrefix} Job [${job?.id}] failed`);
    appLogger.verbose(err);
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
    appLogger.error(error);
  })
  .on('paused', () => { appLogger.verbose(`${logPrefix} Queue has been paused`); })
  .on('resumed', () => { appLogger.verbose(`${logPrefix} Queue has been resumed`); })
  .on('cleaned', (jobs, type) => { appLogger.verbose(`${logPrefix} ${jobs.length} old jobs of type [${type}] have been cleaned`); })
  .on('drained', () => { appLogger.verbose(`${logPrefix} Queue has no more pending jobs`); })
  .on('removed', (job) => { appLogger.verbose(`${logPrefix} Job [${job?.id}] removed`); });

module.exports = {
  harvestQueue,
};
