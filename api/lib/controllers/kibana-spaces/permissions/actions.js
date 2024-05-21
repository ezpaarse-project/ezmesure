const { prepareStandardQueryParams } = require('../../../services/std-query');

const SpacesService = require('../../../entities/spaces.service');
const SpacePermissionsService = require('../../../entities/space-permissions.service');

const {
  schema,
  includableFields,
  upsertSchema,
} = require('../../../entities/space-permissions.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username'],
});
exports.standardQueryParams = standardQueryParams;

exports.getSpacePermissions = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.spaceId = ctx.state.space.id;

  const spacePermissionsService = new SpacePermissionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await spacePermissionsService.count({ where: prismaQuery.where }));
  ctx.body = await spacePermissionsService.findMany(prismaQuery);
};

exports.upsertSpaceAllPermission = async (ctx) => {
  const { space } = ctx.state;

  const permissionData = ctx.request.body.map((permission) => ({
    ...permission,
    membership: {
      connect: {
        username_institutionId: {
          username: permission.username,
          institutionId: space.institutionId,
        },
      },
    },
  }));

  const newSpace = SpacesService.$transaction(async (spacesService) => {
    await spacesService.update({
      where: { id: space.id },
      data: {
        permissions: {
          deleteMany: { spaceId: space.id },
        },
      },
    });

    return spacesService.update({
      where: { id: space.id },
      data: {
        permissions: {
          upsert: permissionData.map(({ username, ...data }) => ({
            where: {
              username_spaceId: {
                username,
                spaceId: space.id,
              },
            },
            create: data,
            update: data,
          })),
        },
      },
    });
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = newSpace;
};

exports.upsertPermission = async (ctx) => {
  const { space } = ctx.state;
  const { username } = ctx.params;

  const { value: body } = upsertSchema.validate({
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
