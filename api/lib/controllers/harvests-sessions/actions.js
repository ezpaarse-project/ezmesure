const { prepareStandardQueryParams } = require('../../services/std-query');
const { propsToPrismaInclude } = require('../../services/std-query/prisma-query');
const { appLogger } = require('../../services/logger');

const HTTPError = require('../../models/HTTPError');

const ActionsService = require('../../entities/actions.service');
const HarvestSessionService = require('../../entities/harvest-session.service');

const { Prisma } = require('../../services/prisma');

const { schema, includableFields } = require('../../entities/harvest-session.dto');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.include = {
    ...prismaQuery.include,
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
    ...prismaQuery.include,
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
  ctx.type = 'json';
  const { body } = ctx.request;
  const { harvestId } = ctx.params;

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

    await actionService.create({
      data: {
        type: 'harvest-sessions/create',
        author: { connect: { username: ctx.state.user.username } },
        data: {
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
              jobs: true,
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
              jobs: true,
            },
          },
        },
      });

      await actionService.create({
        data: {
          type: 'harvest-sessions/upsert',
          author: { connect: { username: ctx.state.user.username } },
          data: {
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

  const actionService = new ActionsService();
  await actionService.create({
    data: {
      type: 'harvest-sessions/delete',
      author: { connect: { username: ctx.state.user.username } },
      data: {
        oldState: session,
      },
    },
  });

  ctx.status = 204;
};
