const HTTPError = require('../../models/HTTPError');

const HarvestSessionService = require('../../entities/harvest-session.service');
const HarvestService = require('../../entities/harvest.service');
const InstitutionsService = require('../../entities/institutions.service');
const EndpointsService = require('../../entities/sushi-endpoints.service');

const { harvestQueue } = require('../../services/jobs');

const { schema, includableFields } = require('../../entities/harvest-session.dto');
const { appLogger } = require('../../services/logger');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { propsToPrismaInclude } = require('../../services/std-query/prisma-query');

const MATRIX_CACHE_DURATION = 5 * 60 * 1000;
const JOBS_CACHE_DURATION = 5 * 60 * 1000;

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
      // Default values
      timeout: 600,
      allowFaulty: false,
      downloadUnsupported: false,
      forceDownload: false,
      sendEndMail: true,
      allowedCounterVersions: ['5.1', '5'],
      params: {},
      // Provided values
      ...body,
      // Provided id
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

      const data = {
        // Default values
        timeout: 600,
        allowFaulty: false,
        downloadUnsupported: false,
        forceDownload: false,
        sendEndMail: true,
        allowedCounterVersions: ['5.1', '5'],
        params: {},
        // Provided values
        ...body,
        // Provided id
        id: harvestId,
      };

      return harvestSessionService.upsert({
        where: { id: harvestId },
        create: data,
        update: data,
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

const jobsStarted = new Map();

async function startSession(session, options = {}) {
  try {
    const service = new HarvestSessionService();
    const harvestJobs = service.start(session, options);

    const now = new Date();
    const jobs = [];
    // Add jobs to queue
    // eslint-disable-next-line no-restricted-syntax
    for await (const harvestJob of harvestJobs) {
      jobs.push(harvestJob);
      jobsStarted.set(session.id, {
        status: 'starting',
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
    jobsStarted.set(session.id, {
      status: 'starting',
      error: err instanceof Error ? err.message : `${err}`,
    });
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

  ctx.status = 200;
  ctx.body = {
    ...session,
    status: 'starting',
  };
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'harvest-sessions/delete';
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const where = { id: harvestId };

  const session = await harvestSessionService.findUnique({ where });
  if (!session) {
    return null;
  }

  await harvestSessionService.update({ where, data: { deletedAt: new Date() } });

  // Don't wait for promise to allow running in the background
  harvestSessionService.delete({ where: { id: harvestId } })
    .then(() => { appLogger.info(`[harvest-sessions] Deleted ${harvestId}`); })
    .catch((error) => { appLogger.error(`[harvest-sessions] Couldn't delete ${harvestId}: ${error}`); });

  ctx.status = 204;
};

const jobsStopped = new Map();

async function stopSession(session) {
  try {
    const service = new HarvestSessionService();
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
    jobsStopped.set(session.id, {
      status: 'stopping',
      error: err instanceof Error ? err.message : `${err}`,
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

  if (!HarvestSessionService.isActive(session)) {
    ctx.status = 204;
    return;
  }

  jobsStopped.set(session.id, { status: 'stopping', jobs: [] });

  // Don't await promise so it runs in the background
  stopSession(session);

  ctx.status = 200;
  ctx.body = {
    ...session,
    status: 'stopping',
  };
};

const cache = new Map();

async function computeMatrix(id, query) {
  const data = { requestedAt: new Date() };

  try {
    cache.set(id, data);

    const { sessionId } = query;

    const harvests = new HarvestService();
    const institutions = new InstitutionsService();
    const endpoints = new EndpointsService();

    // Generate matrix
    const matrix = await harvests.getMatrix(
      (harvest) => harvest.credentials.endpointId,
      (harvest) => harvest.credentials.institutionId,
      {
        where: {
          harvestedBy: {
            sessionId,
          },
        },
        include: {
          credentials: {
            select: { endpointId: true, institutionId: true },
          },
        },
      },
    );

    // Resolve headers
    const [columns, rows] = await Promise.all([
      institutions.findMany({ where: { id: { in: matrix.headers.columns } } }),
      endpoints.findMany({ where: { id: { in: matrix.headers.rows } } }),
    ]);

    const institutionMap = new Map(rows.map((institution) => [institution.id, institution]));
    const endpointMap = new Map(rows.map((endpoint) => [endpoint.id, endpoint]));

    // Cache matrix
    data.generatedAt = new Date();
    data.matrix = {
      ...matrix,
      headers: {
        columns,
        rows,
      },
      rows: matrix.rows
        // Sort cells by institution
        .map((row) => ({
          ...row,
          cells: row.cells.toSorted((cellA, cellB) => {
            const institutionA = institutionMap.get(cellA.columnId) ?? { name: '' };
            const institutionB = institutionMap.get(cellB.columnId) ?? { name: '' };
            return institutionA.name.localeCompare(institutionB.name);
          }),
        }))
        // Sort rows by vendor
        .sort((rowA, rowB) => {
          const endpointA = endpointMap.get(rowA.id) ?? { vendor: '' };
          const endpointB = endpointMap.get(rowB.id) ?? { vendor: '' };
          return endpointA.vendor.localeCompare(endpointB.vendor);
        }),
    };

    cache.set(id, data);
  } catch (error) {
    // Cache error
    data.error = error;
    cache.set(id, data);
  } finally {
    // Delete cache when it expires
    setTimeout(() => {
      cache.delete(id);
    }, MATRIX_CACHE_DURATION);
  }
}

exports.getMatrix = async (ctx) => {
  const { harvestId } = ctx.params;
  const { retryCode = 202 } = ctx.request.query;

  const query = { sessionId: harvestId };

  const requestId = JSON.stringify(query);
  const cached = cache.get(requestId);

  if (!cached) {
    // Don't await promise so it runs in the background
    computeMatrix(requestId, query);

    ctx.type = 'json';
    ctx.status = retryCode;
    ctx.body = { requestedAt: new Date() };
    return;
  }

  if (cached.error) {
    ctx.throw(500, cached.error);
    return;
  }

  ctx.type = 'json';
  ctx.status = cached.matrix ? 200 : retryCode;
  ctx.body = cached;
};
