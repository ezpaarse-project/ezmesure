const RolesService = require('../../entities/roles.service');

/** @typedef {import('../../.prisma/client.mjs').Prisma.RoleCreateInput} RoleCreateInput */

const { schema, includableFields, adminImportSchema } = require('../../entities/roles.dto');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id', 'label'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

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

exports.importMany = async (ctx) => {
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
   * @param {RolesService} rolesService
   * @param {*} roleData
   */
  const importItem = async (rolesService, roleData = {}) => {
    const { value: item, error } = adminImportSchema.validate(roleData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const role = await rolesService.findUnique({ where: { id: item.id } });

      if (role && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.role.alreadyExists', role.id));
        return;
      }
    }

    /** @type {RoleCreateInput} */
    const data = { ...item };

    const role = await rolesService.upsert({
      where: { id: item.id },
      create: data,
      update: data,
    });

    addResponseItem(role, 'created');
  };

  await RolesService.$transaction(async (rolesService) => {
    for (let i = 0; i < body.length; i += 1) {
      const roleData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(rolesService, roleData);
      } catch (e) {
        addResponseItem(roleData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
