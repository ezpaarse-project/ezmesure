const { harvestQueue } = require('../../services/jobs');

const queues = new Map([
  ['harvest', harvestQueue],
]);

const queueIds = Array.from(queues.keys());

async function getQueueStats(queueId) {
  const queue = queues.get(queueId);

  return queue && {
    id: queueId,
    paused: await queue.isPaused(),
    jobCounts: await queue.getJobCounts(),
  };
}

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = await Promise.all(queueIds.map((queueId) => getQueueStats(queueId)));
};

exports.getOne = async (ctx) => {
  const { queueId } = ctx.params;

  const queue = queues.get(queueId);

  if (!queue) {
    ctx.throw(404, ctx.$t('errors.queue.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = await getQueueStats(queueId);
};

exports.pauseOne = async (ctx) => {
  const { queueId } = ctx.params;

  const queue = queues.get(queueId);

  if (!queue) {
    ctx.throw(404, ctx.$t('errors.queue.notFound'));
    return;
  }

  const onlyCurrentWorker = false;
  const doNotWaitForActiveJobs = true;
  await queue.pause(onlyCurrentWorker, doNotWaitForActiveJobs);

  const paused = await queue.isPaused();

  ctx.status = 200;
  ctx.body = { paused };
};

exports.resumeOne = async (ctx) => {
  const { queueId } = ctx.params;

  const queue = queues.get(queueId);

  if (!queue) {
    ctx.throw(404, ctx.$t('errors.queue.notFound'));
    return;
  }

  await queue.resume();
  const paused = await queue.isPaused();

  ctx.status = 200;
  ctx.body = { paused };
};
