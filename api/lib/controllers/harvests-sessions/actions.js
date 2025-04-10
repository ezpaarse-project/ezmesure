const HTTPError = require('../../models/HTTPError');

const HarvestSessionService = require('../../entities/harvest-session.service');

const { harvestQueue } = require('../../services/jobs');

const { schema, includableFields } = require('../../entities/harvest-session.dto');
const { appLogger } = require('../../services/logger');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { propsToPrismaInclude } = require('../../services/std-query/prisma-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.include = {
    ...(prismaQuery.include || {}),
    _count: {
      select: {
        jobs: true,
      },
    },
  };

  const harvestSessionService = new HarvestSessionService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await harvestSessionService.count({ where: prismaQuery.where }));
  ctx.body = await harvestSessionService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { harvestId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: harvestId });
  prismaQuery.include = {
    ...(prismaQuery.include || {}),
    _count: {
      select: {
        jobs: true,
      },
    },
  };

  const harvestSessionService = new HarvestSessionService();
  const session = await harvestSessionService.findUnique(prismaQuery);

  if (!session) {
    ctx.throw(404, ctx.$t('errors.harvest.sessionNotFound', harvestId));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = session;
};

exports.getManyStatus = async (ctx) => {
  ctx.type = 'json';
  const { harvestIds } = ctx.request.query;

  const sessionStatusesEntries = await HarvestSessionService.$transaction(
    (harvestSessionService) => Promise.all(
      harvestIds.map(async (id) => [id, await harvestSessionService.getStatus({ id })]),
    ),
  );

  ctx.status = 200;
  ctx.body = Object.fromEntries(sessionStatusesEntries);
};

exports.getOneCredentials = async (ctx) => {
  ctx.type = 'json';
  const { harvestId } = ctx.params;
  const { type, include } = ctx.request.query;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({ where: { id: harvestId } });
  if (!session) {
    ctx.throw(404, ctx.$t('errors.harvest.sessionNotFound', harvestId));
    return;
  }

  const credentials = await harvestSessionService.getCredentials(
    session,
    { include: propsToPrismaInclude(include, ['endpoint', 'institution']) },
  );

  ctx.status = 200;
  ctx.body = type === 'harvestable' ? credentials.harvestable : credentials.all;
};

exports.createOne = async (ctx) => {
  ctx.action = 'harvest-sessions/create';
  ctx.type = 'json';
  const { body: { institutions, ...body } } = ctx.request;
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  ctx.status = 200;
  ctx.body = await harvestSessionService.create({
    data: {
      ignoreValidation: null,
      ...body,
      id: harvestId,
    },
    include: {
      _count: {
        select: {
          jobs: true,
        },
      },
    },
  });
};

exports.upsertOne = async (ctx) => {
  ctx.action = 'harvest-sessions/upsert';
  ctx.type = 'json';
  const { body: { institutions, ...body } } = ctx.request;
  const { harvestId } = ctx.params;

  const upsertedSession = await HarvestSessionService.$transaction(
    async (harvestSessionService) => {
      const session = await harvestSessionService.findUnique({
        where: { id: harvestId },
        include: {
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      });

      // eslint-disable-next-line no-underscore-dangle
      if (session && session._count.jobs > 0) {
        throw new HTTPError(409, 'errors.harvest.updateSessionAfterStart', [harvestId]);
      }

      return harvestSessionService.upsert({
        where: { id: harvestId },
        create: {
          ignoreValidation: null,
          ...body,
          id: harvestId,
        },
        update: {
          ignoreValidation: null,
          ...body,
          id: harvestId,
        },
        include: {
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      });
    },
  );

  ctx.status = 200;
  ctx.body = upsertedSession;
};

exports.startOne = async (ctx) => {
  ctx.action = 'harvest-sessions/start';
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

  if (await harvestSessionService.isActive(session)) {
    ctx.throw(409, ctx.$t('errors.harvest.sessionAlreadyRunning', harvestId));
    return;
  }

  const harvestJobs = harvestSessionService.start(session, {
    restartAll,
    forceRefreshSupported,
    dryRun,
  });

  const now = new Date();
  const jobs = [];
  // Add jobs to queue
  // eslint-disable-next-line no-restricted-syntax
  for await (const harvestJob of harvestJobs) {
    jobs.push(harvestJob);

    if (!dryRun) {
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
  }

  ctx.status = 201;
  ctx.body = jobs;
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'harvest-sessions/delete';
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  await harvestSessionService.delete({ where: { id: harvestId } });

  ctx.status = 204;
};

exports.stopOne = async (ctx) => {
  ctx.action = 'harvest-sessions/stop';
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

  if (!await harvestSessionService.isActive(session)) {
    ctx.status = 204;
    return;
  }

  const harvestJobs = harvestSessionService.stop(session);

  // Cancel jobs from queue
  // eslint-disable-next-line no-restricted-syntax
  for await (const harvestJob of harvestJobs) {
    try {
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

  ctx.status = 204;
};
