const ActionsService = require('../../entities/actions.service');
const HarvestSessionService = require('../../entities/harvest-session.service');

const { harvestQueue } = require('../../services/jobs');

const JOBS_CACHE_DURATION = 5 * 60 * 1000;

const jobsStarted = new Map();

async function startSession(session, options = {}) {
  const service = new HarvestSessionService();

  try {
    const harvestJobs = service.start(session, options);

    const now = new Date();
    const jobs = [];
    // Add jobs to queue
    // eslint-disable-next-line no-restricted-syntax
    for await (const harvestJob of harvestJobs) {
      jobs.push(harvestJob);
      jobsStarted.set(session.id, {
        status: 'starting',
        error: undefined,
        jobs,
      });

      if (options.dryRun) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const job = await harvestQueue.getJob(harvestJob.id);
      if (job) {
        await job.moveToDelayed(now + 100);
        // eslint-disable-next-line no-continue
        continue;
      }

      await harvestQueue.add(
        'harvest',
        { taskId: harvestJob.id, timeout: session.timeout },
        { jobId: harvestJob.id },
      );
    }

    jobsStarted.set(session.id, {
      status: 'running',
      jobs,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(`${err}`);

    const data = {
      status: 'starting',
      error: {
        name: error.name,
        message: error.message,
        cause: error.cause,
      },
    };

    jobsStarted.set(session.id, data);

    if (!options.dryRun) {
      await service.update({
        where: { id: session.id },
        data,
      });
    }
  }

  setTimeout(() => {
    jobsStarted.delete(session.id);
  }, JOBS_CACHE_DURATION);
}

exports.getStartStatus = async (ctx) => {
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
  ctx.body = jobsStarted.get(session.id) ?? {
    status: session.status,
    jobs: session.jobs,
  };
};

exports.startOne = async (ctx) => {
  ctx.type = 'json';
  const { harvestId } = ctx.params;
  const {
    restartAll = false,
    forceRefreshSupported = false,
    dryRun = false,
  } = ctx.request.body;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({
    where: { id: harvestId },
  });

  if (!session) {
    ctx.throw(404, ctx.$t('errors.harvest.sessionNotFound', harvestId));
    return;
  }

  if (HarvestSessionService.isActive(session)) {
    ctx.throw(409, ctx.$t('errors.harvest.sessionAlreadyRunning', harvestId));
    return;
  }

  jobsStarted.set(session.id, { status: 'starting', jobs: [] });

  // Don't await promise so it runs in the background
  startSession(session, {
    restartAll,
    forceRefreshSupported,
    dryRun,
  });

  if (!dryRun) {
    const actionService = new ActionsService();
    await actionService.create({
      data: {
        type: 'harvest-sessions/start',
        author: { connect: { username: ctx.state.user.username } },
        data: {
          sessionId: session.id,
          beginDate: session.beginDate,
          endDate: session.endDate,
          state: {
            ...session,
            status: 'starting',
          },
          options: {
            restartAll,
            forceRefreshSupported,
          },
        },
      },
    });
  }

  ctx.status = 200;
  ctx.body = {
    ...session,
    status: 'starting',
  };
};
