const RolesService = require('../../entities/roles.service');

/** @typedef {import('@prisma/client').Prisma.HarvestJobWhereInput} HarvestJobWhereInput */

const { schema, includableFields } = require('../../entities/roles.dto');
const { stringOrArray } = require('../../services/utils');
const { prepareStandardQueryParams } = require('../../services/std-query');
const { queryToPrismaFilter } = require('../../services/std-query/prisma-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id', 'label'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const {
    endpointId,
    tags,
    packages,
  } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (endpointId || tags || packages) {
    prismaQuery.where.credentials = {
      endpointId: queryToPrismaFilter(endpointId),
      tags: tags && { hasSome: stringOrArray(tags) },
      packages: packages && { hasSome: stringOrArray(packages) },
    };
  }

  const rolesService = new RolesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await rolesService.count({ where: prismaQuery.where }));
  ctx.body = await rolesService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { roleId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: roleId });

  const rolesService = new RolesService();
  const role = await rolesService.findUnique(prismaQuery);

  if (!role) {
    ctx.throw(404, ctx.$t('errors.role.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = role;
};

exports.upsertOne = async (ctx) => {
  const { roleId } = ctx.params;
  const { body } = ctx.request;

  const { upserted, existing } = await RolesService.$transaction(async (service) => {
    if (body.id && body.id !== roleId) {
      const conflict = await service.findUnique({ where: { id: body.id } });
      if (conflict) {
        ctx.throw(409, ctx.$t('errors.role.alreadyExists', body.id));
      }
    }

    const existingRole = await service.findUnique({
      where: { id: roleId },
    });

    const upsertedRole = await service.upsert({
      where: { id: roleId },
      create: { ...body },
      update: { ...body },
    });

    return {
      existing: existingRole,
      upserted: upsertedRole,
    };
  });

  ctx.status = existing ? 200 : 201;
  ctx.body = upserted;
};

exports.deleteOne = async (ctx) => {
  const { roleId } = ctx.params;

  const rolesService = new RolesService();
  await rolesService.delete({ where: { id: roleId } });

  ctx.status = 204;
};
