const { prepareStandardQueryParams } = require('../../../services/std-query');

const SpacesService = require('../../../entities/spaces.service');

const {
  schema,
  includableFields,
} = require('../../../entities/spaces.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../.prisma/client.mjs').Prisma.RepositoryPermissionCreateInput} RepositoryPermissionCreateInput
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
});
exports.standardQueryParams = standardQueryParams;

exports.getInstitutionSpaces = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutionId = ctx.state.institution.id;

  const spacesService = new SpacesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await spacesService.count({ where: prismaQuery.where }));
  ctx.body = await spacesService.findMany(prismaQuery);
};
