const InstitutionService = require('../../../entities/institutions.service');
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
  const { institutionId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutions = { some: { id: institutionId } };

  const elasticRoleService = new ElasticRoleService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await elasticRoleService.count({ where: prismaQuery.where }));
  ctx.body = await elasticRoleService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { institutionId, name } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { name });
  prismaQuery.where.institutions = { some: { id: institutionId } };

  const elasticRoleService = new ElasticRoleService();
  const role = await elasticRoleService.findUnique(prismaQuery);

  if (!role) {
    ctx.throw(404, ctx.$t('errors.role.notFound', name));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = role;
};

exports.connectRole = async (ctx) => {
  const { institutionId, name } = ctx.params;

  const institutionService = new InstitutionService();

  ctx.status = 200;
  ctx.body = await institutionService.connectRole(institutionId, name);
};

exports.disconnectRole = async (ctx) => {
  const { institutionId, name } = ctx.params;

  const institutionService = new InstitutionService();

  ctx.status = 200;
  ctx.body = await institutionService.disconnectRole(institutionId, name);
};
