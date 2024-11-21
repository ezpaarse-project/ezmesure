const { prepareStandardQueryParams } = require('../../../services/std-query');

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

  const permissions = ctx.request.body;

  const spacePermissionsService = new SpacePermissionsService();
  // If a permission is not provided, we will delete it
  const newUsernames = new Set(permissions.map((permission) => permission.username));
  const oldPermissions = await spacePermissionsService.findMany({
    where: {
      spaceId: space.id,
    },
  });
  const permissionsToDelete = oldPermissions.filter((p) => !newUsernames.has(p.username));

  // Do every operation in a single transaction, to avoid race conditions
  // and revert if something goes wrong
  await SpacePermissionsService.$transaction(
    async (service) => {
      await Promise.all([
        // Delete old permissions
        ...permissionsToDelete.map(
          (permission) => service.delete({
            where: {
              username_spaceId: {
                username: permission.username,
                spaceId: space.id,
              },
            },
          }),
        ),
        // Upsert new permissions (connect to existing models to avoid creating if doesn't exists)
        ...permissions.map(
          (permission) => service.upsert({
            where: {
              username_spaceId: {
                username: permission.username,
                spaceId: space.id,
              },
            },
            create: {
              readonly: permission.readonly,
              locked: permission.locked,
              space: {
                connect: {
                  id: space.id,
                },
              },
              membership: {
                connect: {
                  username_institutionId: {
                    username: permission.username,
                    institutionId: space.institutionId,
                  },
                },
              },
            },
            update: {
              readonly: permission.readonly,
              locked: permission.locked,
            },
          }),
        ),
      ]);
    },
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = space;
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
