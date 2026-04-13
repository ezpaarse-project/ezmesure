const { appLogger } = require('../../services/logger');

const HarvestSessionService = require('../../entities/harvest-session.service');
const ActionsService = require('../../entities/actions.service');

const { harvestQueue } = require('../../services/jobs');

const JOBS_CACHE_DURATION = 5 * 60 * 1000;

const jobsStopped = new Map();

async function stopSession(session) {
  const service = new HarvestSessionService();

  try {
    const harvestJobs = service.stop(session);

    const jobs = [];
    // Cancel jobs from queue
    // eslint-disable-next-line no-restricted-syntax
    for await (const harvestJob of harvestJobs) {
      try {
        jobs.push(harvestJob);
        jobsStopped.set(session.id, {
          status: 'stopping',
          jobs,
        });

        const job = await harvestQueue.getJob(harvestJob.id);
        if (!job) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Remove job if not currently running
        if (!await job.isActive()) {
          await job.remove();
          // eslint-disable-next-line no-continue
          continue;
        }

        // Kill job if currently running
        if (!job?.data?.pid) {
          throw new Error('Cannot cancel job without PID');
        }

        process.kill(job.data.pid, 'SIGTERM');
      } catch (error) {
        appLogger.error(`[Harvest Queue] Failed to stop job ${harvestJob.id}: ${error}`);
      }
    }

    jobsStopped.set(session.id, {
      status: 'stopped',
      jobs,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`);

    const data = {
      status: 'stopping',
      error: {
        name: error.name,
        message: error.message,
        cause: error.cause,
      },
    };

    jobsStopped.set(session.id, data);

    await service.update({
      where: { id: session.id },
      data,
    });
  }

  setTimeout(() => {
    jobsStopped.delete(session.id);
  }, JOBS_CACHE_DURATION);
}

exports.getStopStatus = async (ctx) => {
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({
    where: { id: harvestId },
    select: { id: true, status: true, jobs: true },
  });

  if (!session) {
    ctx.throw(404, ctx.$t('errors.harvest.sessionNotFound', harvestId));
  }

  ctx.status = 200;
  ctx.body = jobsStopped.get(session.id) ?? {
    status: session.status,
    jobs: session.jobs,
  };
};

exports.stopOne = async (ctx) => {
  ctx.type = 'json';
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({
    where: { id: harvestId },
  });

  if (!session) {
    ctx.throw(404, ctx.$t('errors.harvest.sessionNotFound', harvestId));
    return;
  }

  if (!HarvestSessionService.isActive(session)) {
    ctx.status = 204;
    return;
  }

  jobsStopped.set(session.id, { status: 'stopping', jobs: [] });

  // Don't await promise so it runs in the background
  stopSession(session);

  const actionService = new ActionsService();
  await actionService.create({
    data: {
      type: 'harvest-sessions/stop',
      author: { connect: { username: ctx.state.user.username } },
      data: {
        state: {
          ...session,
          status: 'stopping',
        },
      },
    },
  });

  ctx.status = 200;
  ctx.body = {
    ...session,
    status: 'stopping',
  };
};
