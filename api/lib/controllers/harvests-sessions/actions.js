const HarvestSessionService = require('../../entities/harvest-session.service');
const HarvestJobsService = require('../../entities/harvest-job.service');
const SushiCredentialsService = require('../../entities/sushi-credentials.service');

const { harvestQueue } = require('../../services/jobs');

const { propsToPrismaInclude, propsToPrismaSort } = require('../utils');

const { includableFields } = require('../../entities/harvest-session.dto');

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  const {
    size,
    sort,
    order = 'asc',
    page = 1,
    include: propsToInclude,
  } = ctx.request.query;

  const harvestSessionService = new HarvestSessionService();

  const requests = await harvestSessionService.findMany({
    orderBy: propsToPrismaSort(sort, order),
    take: Number.isInteger(size) && size > 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    include: {
      ...propsToPrismaInclude(propsToInclude, includableFields),
      _count: {
        select: {
          jobs: true,
          credentials: true,
        },
      },
    },
  });

  ctx.set('X-Total-Count', await harvestSessionService.count({}));
  ctx.status = 200;
  ctx.body = requests;
};

exports.getOne = async (ctx) => {
  ctx.type = 'json';
  const {
    include: propsToInclude,
  } = ctx.query;
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({
    where: {
      id: harvestId,
    },
    include: {
      ...propsToPrismaInclude(propsToInclude, includableFields),
      _count: {
        select: {
          jobs: true,
          credentials: true,
        },
      },
    },
  });

  if (!session) {
    ctx.throw(ctx.$t('errors.harvestSession.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = session;
};

exports.getOneStatus = async (ctx) => {
  ctx.type = 'json';
  const { harvestId } = ctx.params;

  const sessionStatus = await HarvestSessionService.$transaction(
    /* eslint-disable no-underscore-dangle */
    async (harvestSessionService) => {
      const session = await harvestSessionService.findUnique({
        where: { id: harvestId },
        include: {
          credentials: true,
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      });

      if (!session) {
        // TODO: better error - session.id
        throw new Error('errors.harvestSession.notFound');
      }

      const harvestJobsService = new HarvestJobsService(harvestSessionService);

      // Get count of jobs by status
      const countsPerStatus = await harvestJobsService.groupBy({
        where: { sessionId: harvestId },
        by: ['status'],
        _count: {
          _all: true,
        },
      });
      const statuses = new Map(countsPerStatus.map(({ status, _count }) => [status, _count._all]));

      // Get running time
      const timings = await harvestJobsService.aggregate({
        where: { sessionId: harvestId },
        _min: {
          startedAt: true,
        },
        _max: {
          updatedAt: true,
        },
      });
      let runningTime;
      if (timings._max?.updatedAt && timings._min?.startedAt) {
        // eslint-disable-next-line no-underscore-dangle
        runningTime = timings._max.updatedAt - timings._min.startedAt;
      }

      const successCount = statuses.get('finished') || 0;
      const activeCount = statuses.get('running') || 0;
      const delayedCount = statuses.get('delayed') || 0;
      const failedCount = (statuses.get('failed') ?? 0)
                + (statuses.get('interrupted') ?? 0)
                + (statuses.get('cancelled') ?? 0);

      return {
        id: session.id,
        beginDate: session.beginDate,
        endDate: session.endDate,

        isActive: await harvestSessionService.isActive(session),
        runningTime,

        metrics: {
          success: successCount,
          active: activeCount,
          delayed: delayedCount,
          failed: failedCount,
          // eslint-disable-next-line no-underscore-dangle
          pending: session._count.jobs - successCount - activeCount - delayedCount - failedCount,
        },
        _count: {
          harvestableCredentials: HarvestSessionService.getHarvestableCredentials(session).length,
          statuses: Object.fromEntries(statuses),
        },
      };
    },
    /* eslint-enable no-underscore-dangle */
  );

  ctx.status = 200;
  ctx.body = sessionStatus;
};

exports.getOneInstitutions = async (ctx) => {
  ctx.type = 'json';
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const session = await harvestSessionService.findUnique({
    where: { id: harvestId },
    include: {
      credentials: {
        distinct: 'institutionId',
        include: {
          institution: true,
        },
      },
    },
  });

  if (!session) {
    ctx.throw(ctx.$t('errors.harvestSession.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = session?.credentials.map(({ institution }) => institution) ?? [];
};

exports.createOne = async (ctx) => {
  ctx.action = 'harvest-sessions/create';
  ctx.type = 'json';
  const { body: { institutions, ...body } } = ctx.request;
  const { harvestId } = ctx.params;

  const createdSession = await HarvestSessionService.$transaction(async (harvestSessionService) => {
    const sushiCredentialsService = new SushiCredentialsService(harvestSessionService);

    // Resolve credentials
    const credentials = body.credentials ?? [];
    if (Array.isArray(institutions) && institutions.length > 0) {
      await Promise.all(
        institutions.map(async (institution) => {
          const institutionCredentials = await sushiCredentialsService.findMany({
            where: { institutionId: institution.id },
            select: { id: true },
          });
          credentials.push(...institutionCredentials);
        }),
      );
    }

    return harvestSessionService.create({
      data: {
        ignoreValidation: null,
        ...body,
        id: harvestId,
        credentials: {
          connect: credentials,
        },
      },
      include: {
        _count: {
          select: {
            jobs: true,
            credentials: true,
          },
        },
      },
    });
  });

  if (!createdSession) {
    ctx.throw(ctx.$t('errors.harvestSession.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = createdSession;
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
      // TODO: better error - session.id
        throw new Error('errors.harvestSession.updateAfterStart');
      }

      const sushiCredentialsService = new SushiCredentialsService(harvestSessionService);

      // Resolve credentials
      const credentials = body.credentials ?? [];
      if (Array.isArray(institutions) && institutions.length > 0) {
        await Promise.all(
          institutions.map(async (institution) => {
            const institutionCredentials = await sushiCredentialsService.findMany({
              where: { institutionId: institution.id },
              select: { id: true },
            });
            credentials.push(...institutionCredentials);
          }),
        );
      }

      return harvestSessionService.upsert({
        where: { id: harvestId },
        create: {
          ignoreValidation: null,
          ...body,
          id: harvestId,
          credentials: {
            connect: credentials,
          },
        },
        update: {
          ignoreValidation: null,
          ...body,
          id: harvestId,
          credentials: {
            set: credentials,
          },
        },
        include: {
          _count: {
            select: {
              jobs: true,
              credentials: true,
            },
          },
        },
      });
    },
  );

  if (!upsertedSession) {
    ctx.throw(ctx.$t('errors.harvestSession.notFound'));
    return;
  }

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
    ctx.throw(ctx.$t('errors.harvestSession.notFound'));
    return;
  }

  const harvestJobs = await harvestSessionService.start(session);

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
            console.error(error);
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
