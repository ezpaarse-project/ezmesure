const { prepareStandardQueryParams } = require('../../../services/std-query');

const RepositoryAliasesService = require('../../../entities/repository-aliases.service');
const AliasPermissionsService = require('../../../entities/repository-alias-permissions.service');

const {
  schema,
  includableFields,
} = require('../../../entities/repository-aliases.dto');

const {
  upsertSchema: permissionUpsertSchema,
} = require('../../../entities/repository-permissions.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['pattern'],
});
exports.standardQueryParams = standardQueryParams;

exports.getInstitutionRepositoryAliases = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutions = { some: { id: ctx.state.institution.id } };

  const repositoryAliasesService = new RepositoryAliasesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await repositoryAliasesService.count({ where: prismaQuery.where }));
  ctx.body = await repositoryAliasesService.findMany(prismaQuery);
};

exports.upsertRepositoryAliasAllPermission = async (ctx) => {
  const { alias, institution } = ctx.state;

  const permissions = ctx.request.body;

  const aliasPermissionsService = new AliasPermissionsService();
  // If a permission is not provided, we will delete it
  const newUsernames = new Set(permissions.map((permission) => permission.username));
  const oldPermissions = await aliasPermissionsService.findMany({
    where: {
      aliasPattern: alias.pattern,
      institutionId: institution.id,
    },
  });
  const permissionsToDelete = oldPermissions.filter((p) => !newUsernames.has(p.username));

  const newRepository = await AliasPermissionsService.$transaction(
    async (service) => {
      const repositoryAliasesService = new RepositoryAliasesService(service);

      await Promise.all([
        // Delete old permissions
        ...permissionsToDelete.map(
          (permission) => service.delete({
            where: {
              username_institutionId_aliasPattern: {
                username: permission.username,
                institutionId: institution.id,
                aliasPattern: alias.pattern,
              },
            },
          }),
        ),
        // Upsert new permissions (connect to existing models to avoid creating if doesn't exists)
        ...permissions.map(
          (permission) => service.upsert({
            where: {
              username_institutionId_aliasPattern: {
                username: permission.username,
                institutionId: institution.id,
                aliasPattern: alias.pattern,
              },
            },
            create: {
              readonly: permission.readonly,
              locked: permission.locked,
              repositoryAlias: {
                connect: {
                  pattern: alias.pattern,
                },
              },
              membership: {
                connect: {
                  username_institutionId: {
                    username: permission.username,
                    institutionId: institution.id,
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

      return repositoryAliasesService.findUnique({
        where: {
          pattern: alias.pattern,
          institutions: { some: { id: institution.id } },
        },
      });
    },
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = newRepository;
};

exports.upsertRepositoryAliasPermission = async (ctx) => {
  const { alias, institution } = ctx.state;
  const { username } = ctx.params;

  const { value: body } = permissionUpsertSchema.validate({
    ...ctx.request.body,
    institutionId: institution.id,
    pattern: alias.pattern,
    username,
  });

  /** @type {RepositoryPermissionCreateInput} */
  const permissionData = {
    ...body,
    repositoryAlias: {
      connect: {
        pattern: alias.pattern,
      },
    },
    membership: {
      connect: {
        username_institutionId: {
          username,
          institutionId: institution.id,
        },
      },
    },
  };

  const aliasPermissionsService = new AliasPermissionsService();

  ctx.status = 200;
  ctx.body = await aliasPermissionsService.upsert({
    where: {
      username_institutionId_aliasPattern: {
        username,
        institutionId: institution.id,
        aliasPattern: alias.pattern,
      },
    },
    create: permissionData,
    update: permissionData,
  });
};

exports.deleteRepositoryAliasPermission = async (ctx) => {
  const { alias, institution } = ctx.state;
  const { username } = ctx.params;

  const aliasPermissionsService = new AliasPermissionsService();

  ctx.status = 200;
  ctx.body = await aliasPermissionsService.delete({
    where: {
      username_institutionId_aliasPattern: {
        username,
        institutionId: institution.id,
        aliasPattern: alias.pattern,
      },
    },
  });
};

exports.removeRepositoryAlias = async (ctx) => {
  const { alias } = ctx.state;
  const { pattern, institutionId } = ctx.params;

  const repositoryAliasesService = new RepositoryAliasesService();

  if (alias.institutions.length >= 2) {
    await repositoryAliasesService.disconnectInstitution(pattern, institutionId);
  } else {
    await repositoryAliasesService.delete({ where: { pattern } });
  }

  ctx.status = 204;
};

exports.addRepositoryAlias = async (ctx) => {
  const { alias } = ctx.state;
  const { pattern, institutionId } = ctx.params;
  const { body } = ctx.request;

  if (alias && alias.target !== body.target) {
    ctx.throw(409, ctx.$t('repositoryAliases.targetMismatch', alias.pattern));
  }

  const repositoryAliasesService = new RepositoryAliasesService();

  ctx.status = alias ? 200 : 201;
  ctx.body = await repositoryAliasesService.upsert({
    where: { pattern },
    create: {
      pattern,
      filters: body.filters,
      repository: {
        connect: {
          pattern: body.target,
        },
      },
      institutions: {
        connect: {
          id: institutionId,
        },
      },
    },
    update: {
      institutions: {
        connect: {
          id: institutionId,
        },
      },
    },
  });
};
