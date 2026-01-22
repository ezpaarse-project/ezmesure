const MembershipsService = require('../../entities/memberships.service');

const {
  schema,
  includableFields,
} = require('../../entities/memberships.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username', 'institutionId'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const { roleId } = ctx.request.body;
  const prismaQuery = standardQueryParams.getPrismaManyQuery({ query: ctx.request.body });

  const service = new MembershipsService();

  if (roleId) {
    prismaQuery.where.roles = {
      some: {
        roleId: {
          in: Array.isArray(roleId) ? roleId : [roleId],
        },
      },
    };
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await service.count({ where: prismaQuery.where }));
  ctx.body = await service.findMany(prismaQuery);
};
