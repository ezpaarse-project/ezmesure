const HTTPError = require('../../models/HTTPError');

const HarvestSessionService = require('../../entities/harvest-session.service');
const HarvestJobsService = require('../../entities/harvest-job.service');

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

  const harvestJobs = await harvestSessionService.start(
    session,
    { restartAll: ctx.request.body?.restartAll ?? false },
  );

  const now = new Date();
  // Add jobs to queue
  await Promise.all(
    harvestJobs.flat().map(
      async (harvestJob) => {
        const job = await harvestQueue.getJob(harvestJob.id);
        if (!job) {
          return harvestQueue.add(
            'harvest',
            { taskId: harvestJob.id, timeout: session.timeout },
            { jobId: harvestJob.id },
          );
        }

        return job.moveToDelayed(now + 100);
      },
    ),
  );

  ctx.status = 201;
  ctx.body = harvestJobs;
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

  await HarvestJobsService.$transaction(
    async (harvestJobsService) => {
      const harvestJobs = await harvestJobsService.findMany({
        where: {
          sessionId: harvestId,
        },
      });

      await Promise.all(
        harvestJobs.map(async (harvestJob) => {
          try {
            const job = await harvestQueue.getJob(harvestJob.id);
            if (job) {
              if (await job.isActive()) {
                if (!job?.data?.pid) {
                  throw new Error('Cannot cancel job without PID');
                }

                process.kill(job.data.pid, 'SIGTERM');
              } else {
                await job.remove();
              }
            }
          } catch (error) {
            appLogger.error(`[Harvest Queue] Failed to stop job ${harvestJob.id}: ${error}`);
          }

          if (!HarvestJobsService.isDone(harvestJob)) {
            await harvestJobsService.cancel(harvestJob);
          }
        }),
      );
    },
  );

  ctx.status = 204;
};
