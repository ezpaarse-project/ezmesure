const config = require('config');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { propsToPrismaInclude } = require('../../services/std-query/prisma-query');

const HTTPError = require('../../models/HTTPError');

const ActionsService = require('../../entities/actions.service');
const HarvestSessionService = require('../../entities/harvest-session.service');

const { Prisma } = require('../../services/prisma');

const { schema, includableFields } = require('../../entities/harvest-session.dto');
const { createCache } = require('../../utils/cache-manager');
const HarvestJobsService = require('../../entities/harvest-job.service');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where = {
    ...prismaQuery.where,
    deletedAt: null,
  };
  prismaQuery.include = {
    ...prismaQuery.include,
    _count: {
      select: {
        jobs: { where: { NOT: HarvestJobsService.whereSoftDeleted } },
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

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, {
    id: harvestId,
    deletedAt: null,
  });
  prismaQuery.include = {
    ...prismaQuery.include,
    _count: {
      select: {
        jobs: { where: { NOT: HarvestJobsService.whereSoftDeleted } },
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

const statusCache = createCache(config.get('cache.duration.harvestSessionStatus'));

exports.getManyStatus = async (ctx) => {
  ctx.type = 'json';
  const { harvestIds } = ctx.request.query;

  const cachedStatus = new Set(['finished', 'stopped']);

  const sessionStatusesEntries = await HarvestSessionService.$transaction(
    (harvestSessionService) => Promise.all(
      harvestIds.map(async (id) => {
        const session = await harvestSessionService.findUnique({
          where: { id, deletedAt: null },
          select: { status: true },
        });
        if (!session) {
          return [id, null];
        }

        // Don't cache sessions that status can quickly change
        const shouldCache = cachedStatus.has(session.status);
        const cached = shouldCache ? await statusCache.get(id) : null;
        if (cached) {
          return [id, cached];
        }

        const status = await harvestSessionService.getStatus({ id });
        if (shouldCache) {
          await statusCache.set(id, status);
        }

        return [id, status];
      }),
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

  const session = await harvestSessionService.findUnique({
    where: { id: harvestId, deletedAt: null },
  });
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
  ctx.type = 'json';
  const { body } = ctx.request;

  ctx.status = 200;
  ctx.body = await HarvestSessionService.$transaction(async (service) => {
    const actionService = new ActionsService(service);

    const session = await service.create({
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
      },
      include: {
        _count: {
          select: {
            jobs: { where: { NOT: HarvestJobsService.whereSoftDeleted } },
          },
        },
      },
    });

    await actionService.create({
      data: {
        type: 'harvest-sessions/create',
        author: { connect: { username: ctx.state.user.username } },
        data: {
          sessionId: session.id,
          state: session,
        },
      },
    });

    return session;
  });
};

exports.upsertOne = async (ctx) => {
  ctx.type = 'json';
  const { body } = ctx.request;
  const { harvestId } = ctx.params;

  ctx.status = 200;
  ctx.body = await HarvestSessionService.$transaction(
    async (service) => {
      const actionService = new ActionsService(service);

      const oldSession = await service.findUnique({
        where: { id: harvestId },
        include: {
          _count: {
            select: {
              jobs: { where: { NOT: HarvestJobsService.whereSoftDeleted } },
            },
          },
        },
      });

      // eslint-disable-next-line no-underscore-dangle
      if (oldSession && oldSession._count.jobs > 0) {
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
        // Reset state
        status: 'prepared',
        error: Prisma.DbNull,
      };

      const session = await service.upsert({
        where: { id: harvestId },
        create: data,
        update: data,
        include: {
          _count: {
            select: {
              jobs: { where: { NOT: HarvestJobsService.whereSoftDeleted } },
            },
          },
        },
      });

      await actionService.create({
        data: {
          type: 'harvest-sessions/upsert',
          author: { connect: { username: ctx.state.user.username } },
          data: {
            sessionId: session.id,
            state: session,
            oldState: oldSession,
          },
        },
      });

      return session;
    },
  );
};

exports.deleteOne = async (ctx) => {
  const { harvestId } = ctx.params;

  const harvestSessionService = new HarvestSessionService();

  const where = { id: harvestId, deletedAt: null };

  const session = await harvestSessionService.findUnique({ where });
  if (!session) {
    return null;
  }

  const deletedAt = new Date();
  await harvestSessionService.update({
    where,
    data: {
      deletedAt,
      jobs: {
        updateMany: {
          data: { deletedAt },
          where: { sessionId: harvestId },
        },
      },
    },
  });

  // Actual deletion will be handled later (with jobs)

  // Remove status from cache
  await statusCache.del(harvestId);

  const actionService = new ActionsService();
  await actionService.create({
    data: {
      type: 'harvest-sessions/delete',
      author: { connect: { username: ctx.state.user.username } },
      data: {
        sessionId: session.id,
        oldState: session,
      },
    },
  });

  ctx.status = 204;
};
