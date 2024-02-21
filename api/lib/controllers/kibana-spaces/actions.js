const SpacesService = require('../../entities/spaces.service');
const SpacePermissionsService = require('../../entities/space-permissions.service');
const {
  upsertSchema: permissionUpsertSchema,
} = require('../../entities/space-permissions.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

exports.getMany = async (ctx) => {
  const {
    type,
    institutionId,
    q: search,
  } = ctx.query;

  const where = {
    type,
    institutionId,
  };

  if (search) {
    where.id = {
      contains: search,
      mode: 'insensitive',
    };
  }

  const spacesService = new SpacesService();

  ctx.type = 'json';
  ctx.body = await spacesService.findMany({ where });
};

exports.getOne = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = ctx.state.space;
};

exports.upsertOne = async (ctx) => {
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let space;

  try {
    space = await spacesService.upsert({
      where: { id: space.id },
      create: body,
      update: body,
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
          break;
        case PrismaErrors.RecordNotFound:
          ctx.throw(404, ctx.$t('errors.institution.notFound'));
          break;
        default:
      }
    }
    throw e;
  }

  ctx.status = 201;
  ctx.body = space;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let space;

  try {
    space = await spacesService.create({
      data: {
        ...body,
        institution: { connect: { id: body?.institutionId } },
        institutionId: undefined,
      },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
          break;
        case PrismaErrors.RecordNotFound:
          ctx.throw(404, ctx.$t('errors.institution.notFound'));
          break;
        default:
      }
    }
    throw e;
  }

  ctx.status = 201;
  ctx.body = space;
};

exports.updateOne = async (ctx) => {
  const { space } = ctx.state;
  const { body } = ctx.request;

  const spacesService = new SpacesService();

  let updatedSushiCredentials;

  try {
    updatedSushiCredentials = await spacesService.update({
      where: { id: space.id },
      data: body,
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.space.alreadyExists', body?.id));
          break;
        default:
      }
    }
  }

  ctx.status = 200;
  ctx.body = updatedSushiCredentials;
};

exports.deleteOne = async (ctx) => {
  const { spaceId } = ctx.params;

  const spacesService = new SpacesService();
  await spacesService.delete({ where: { id: spaceId } });

  ctx.status = 204;
};

exports.upsertPermission = async (ctx) => {
  const { space } = ctx.state;
  const { username } = ctx.params;

  const { value: body } = permissionUpsertSchema.validate({
    ...ctx.request.body,
    institutionId: space.institutionId,
    spaceId: space.id,
    username,
  });

  const permissionData = {
    ...body,
    space: { connect: { id: space.id } },
    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: space.institutionId,
        },
      },
    },
  };

  const spacePermissionsService = new SpacePermissionsService();

  ctx.status = 200;
  ctx.body = await spacePermissionsService.upsert({
    where: {
      username_spaceId: {
        username,
        spaceId: space.id,
      },
    },
    create: permissionData,
    update: permissionData,
  });
};

exports.deletePermission = async (ctx) => {
  const { space } = ctx.state;
  const { username } = ctx.params;

  const spacePermissionsService = new SpacePermissionsService();

  ctx.status = 200;
  ctx.body = await spacePermissionsService.delete({
    where: {
      username_spaceId: {
        username,
        spaceId: space.id,
      },
    },
  });
};
