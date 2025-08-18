const UsersService = require('../../entities/users.service');
const MembershipsService = require('../../entities/memberships.service');
const ElasticRoleService = require('../../entities/elastic-roles.service');

const { getToken: getReportingToken } = require('../../services/ezreeport/users');

const { prepareStandardQueryParams } = require('../../services/std-query');

const { generateAppToken } = require('./apptokens');

const { schema: membershipSchema, includableFields: includableMembershipFields } = require('../../entities/memberships.dto');
const { schema: elasticRoleSchema, includableFields: includableElasticRoleFields } = require('../../entities/elastic-roles.dto');

// Query params for sub routes

const standardMembershipsQueryParams = prepareStandardQueryParams({
  schema: membershipSchema,
  includableFields: includableMembershipFields,
  queryFields: [],
});
exports.standardMembershipsQueryParams = standardMembershipsQueryParams;

const standardElasticRolesQueryParams = prepareStandardQueryParams({
  schema: elasticRoleSchema,
  includableFields: includableElasticRoleFields,
  queryFields: [],
});
exports.standardElasticRolesQueryParams = standardElasticRolesQueryParams;

// Routes

exports.getCurrentUser = async (ctx) => {
  const usersService = new UsersService();
  const user = await usersService.findUnique({
    where: { username: ctx.state.user.username },
  });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getCurrentUserAppToken = async (ctx) => {
  ctx.status = 200;
  ctx.body = generateAppToken(ctx.state.user);
};

exports.getCurrentUserReportingToken = async (ctx) => {
  const token = await getReportingToken(ctx?.state?.user?.username);
  ctx.body = { token };
};

exports.getCurrentUserMemberships = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardMembershipsQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.username = username;

  ctx.status = 200;
  const membershipsService = new MembershipsService();
  ctx.body = await membershipsService.findMany(prismaQuery);
};

exports.getCurrentUserElasticRoles = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardElasticRolesQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.users = { some: { username } };

  ctx.status = 200;
  const elasticRolesService = new ElasticRoleService();
  ctx.body = await elasticRolesService.findMany(prismaQuery);
};
