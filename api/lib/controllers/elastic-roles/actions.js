const ElasticRoleService = require('../../entities/elastic-roles.service');
const ElasticRoleRepositoryPermissionService = require('../../entities/elastic-role-repository-permissions.service');
const ElasticRoleRepositoryAliasPermissionService = require('../../entities/elastic-role-repository-alias-permissions.service');
const ElasticRoleSpacePermissionService = require('../../entities/elastic-role-space-permissions.service');

const { schema, includableFields, adminImportSchema } = require('../../entities/elastic-roles.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['name'],
});
exports.standardQueryParams = standardQueryParams;

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.ElasticRoleCreateInput} ElasticRoleCreateInput
*/
/* eslint-enable max-len */

exports.listRoles = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const elasticRoleService = new ElasticRoleService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await elasticRoleService.count({ where: prismaQuery.where }));
  ctx.body = await elasticRoleService.findMany(prismaQuery);
};

exports.getRole = async (ctx) => {
  const { name } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { name });

  const elasticRoleService = new ElasticRoleService();
  const role = await elasticRoleService.findUnique(prismaQuery);

  if (!role) {
    ctx.throw(404, ctx.$t('errors.role.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = role;
};

exports.deleteRole = async (ctx) => {
  ctx.action = 'roles/delete';

  const { name } = ctx.params;

  const elasticRoleService = new ElasticRoleService();

  await elasticRoleService.delete({ where: { name } });

  ctx.status = 204;
};

exports.upsertRole = async (ctx) => {
  ctx.action = 'roles/upsert';

  const { body } = ctx.request;
  const { name } = ctx.params;

  const elasticRoleService = new ElasticRoleService();

  const data = {
    name,
    ...body,
  };

  ctx.status = 200;
  ctx.body = await elasticRoleService.upsert({
    where: { name },
    create: data,
    update: data,
  });
};

exports.importRoles = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {ElasticRoleService} elasticRoleService
   * @param {*} repositoryData
   */
  const importItem = async (elasticRoleService, repositoryData = {}) => {
    const { value: item, error } = adminImportSchema.validate(repositoryData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.name) {
      const role = await elasticRoleService.findUnique({ where: { name: item.name } });

      if (role && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.role.alreadyExists', role.name));
        return;
      }
    }

    /** @type {ElasticRoleCreateInput} */
    const data = {
      ...item,
      repositoryPermissions: {
        connectOrCreate: item.repositoryPermissions?.map(
          (permission) => ({
            where: {
              elasticRoleName_repositoryPattern: {
                elasticRoleName: item.name,
                repositoryPattern: permission.repositoryPattern,
              },
            },
            create: {
              ...permission,
              elasticRoleName: undefined,
              repositoryPattern: undefined,
              repository: {
                connect: {
                  pattern: permission.repositoryPattern,
                },
              },
            },
          }),
        ),
      },
      repositoryAliasPermissions: {
        connectOrCreate: item.repositoryAliasPermissions?.map(
          (permission) => ({
            where: {
              elasticRoleName_aliasPattern: {
                elasticRoleName: item.name,
                aliasPattern: permission.aliasPattern,
              },
            },
            create: {
              ...permission,
              elasticRoleName: undefined,
              aliasPattern: undefined,
              alias: {
                connect: {
                  pattern: permission.aliasPattern,
                },
              },
            },
          }),
        ),
      },
      spacePermissions: {
        connectOrCreate: item.spacePermissions?.map(
          (permission) => ({
            where: {
              elasticRoleName_spaceId: {
                elasticRoleName: item.name,
                spaceId: permission.spaceId,
              },
            },
            create: {
              ...permission,
              elasticRoleName: undefined,
              spaceId: undefined,
              space: {
                connect: {
                  id: permission.spaceId,
                },
              },
            },
          }),
        ),
      },
      users: { connect: item.users?.map((user) => ({ username: user.username })) },
      institutions: { connect: item.institutions?.map((institution) => ({ id: institution.id })) },
    };

    const role = await elasticRoleService.upsert({
      where: { name: item.name },
      create: data,
      update: data,
    });

    addResponseItem(role, 'created');
  };

  await ElasticRoleService.$transaction(async (elasticRoleService) => {
    for (let i = 0; i < body.length; i += 1) {
      const roleData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(elasticRoleService, roleData);
      } catch (e) {
        addResponseItem(roleData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.connectRepository = async (ctx) => {
  const { name: elasticRoleName, pattern: repositoryPattern } = ctx.params;
  const { body } = ctx.request;

  const service = new ElasticRoleRepositoryPermissionService();

  const data = {
    ...body,
    elasticRoleName: undefined,
    repositoryPattern: undefined,
    elasticRole: { connect: { name: elasticRoleName } },
    repository: { connect: { pattern: repositoryPattern } },
  };

  ctx.status = 200;
  ctx.body = await service.upsert({
    where: { elasticRoleName_repositoryPattern: { elasticRoleName, repositoryPattern } },
    create: data,
    update: data,
  });
};

exports.disconnectRepository = async (ctx) => {
  const { name: elasticRoleName, pattern: repositoryPattern } = ctx.params;

  const service = new ElasticRoleRepositoryPermissionService();

  await service.delete({
    where: { elasticRoleName_repositoryPattern: { elasticRoleName, repositoryPattern } },
  });

  ctx.status = 204;
};

exports.connectRepositoryAlias = async (ctx) => {
  const { name: elasticRoleName, pattern: aliasPattern } = ctx.params;
  const { body } = ctx.request;

  const service = new ElasticRoleRepositoryAliasPermissionService();

  const data = {
    ...body,
    elasticRoleName: undefined,
    aliasPattern: undefined,
    elasticRole: { connect: { name: elasticRoleName } },
    alias: { connect: { pattern: aliasPattern } },
  };

  ctx.status = 200;
  ctx.body = await service.upsert({
    where: { elasticRoleName_aliasPattern: { elasticRoleName, aliasPattern } },
    create: data,
    update: data,
  });
};

exports.disconnectRepositoryAlias = async (ctx) => {
  const { name: elasticRoleName, pattern: aliasPattern } = ctx.params;

  const service = new ElasticRoleRepositoryAliasPermissionService();

  await service.delete({
    where: { elasticRoleName_aliasPattern: { elasticRoleName, aliasPattern } },
  });

  ctx.status = 204;
};

exports.connectSpace = async (ctx) => {
  const { name: elasticRoleName, id: spaceId } = ctx.params;
  const { body } = ctx.request;

  const service = new ElasticRoleSpacePermissionService();

  const data = {
    ...body,
    elasticRoleName: undefined,
    spaceId: undefined,
    elasticRole: { connect: { name: elasticRoleName } },
    space: { connect: { id: spaceId } },
  };

  ctx.status = 200;
  ctx.body = await service.upsert({
    where: { elasticRoleName_spaceId: { elasticRoleName, spaceId } },
    create: data,
    update: data,
  });
};

exports.disconnectSpace = async (ctx) => {
  const { name: elasticRoleName, id: spaceId } = ctx.params;

  const service = new ElasticRoleSpacePermissionService();

  await service.delete({
    where: { elasticRoleName_spaceId: { elasticRoleName, spaceId } },
  });

  ctx.status = 204;
};
