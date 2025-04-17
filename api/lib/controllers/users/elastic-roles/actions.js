const UserService = require('../../../entities/users.service');
const ElasticRoleService = require('../../../entities/elastic-roles.service');

const { schema, includableFields } = require('../../../entities/elastic-roles.dto');

const { prepareStandardQueryParams } = require('../../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['name'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const { username } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.users = { some: { username } };

  const elasticRoleService = new ElasticRoleService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await elasticRoleService.count({ where: prismaQuery.where }));
  ctx.body = await elasticRoleService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { username, name } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { name });
  prismaQuery.where.users = { some: { username } };

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

exports.connectRole = async (ctx) => {
  const { username, name } = ctx.params;

  const userService = new UserService();

  ctx.status = 200;
  ctx.body = await userService.connectRole(username, name);
};

exports.disconnectRole = async (ctx) => {
  const { username, name } = ctx.params;

  const userService = new UserService();

  ctx.status = 200;
  ctx.body = await userService.disconnectRole(username, name);
};
