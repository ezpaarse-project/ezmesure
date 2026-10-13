const { prepareStandardQueryParams } = require('../../../services/std-query');

const SpaceDashboardCollectionsService = require('../../../entities/space-dashboard-collection.service');

const {
  schema,
  includableFields,
} = require('../../../entities/space-dashboard-collection.dto');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../.prisma/client.mjs').Prisma.SpaceDashboardCollectionFindManyArgs} SpaceDashboardCollectionFindManyArgs
*/
/* eslint-enable max-len */

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['space.name', 'repositoryPattern'],
});
exports.standardQueryParams = standardQueryParams;

exports.getCollectionSpaces = async (ctx) => {
  const { collectionId } = ctx.request.params;

  /** @type {SpaceDashboardCollectionFindManyArgs} */
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  prismaQuery.where.collectionId = collectionId;

  const spacesService = new SpaceDashboardCollectionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await spacesService.count({ where: prismaQuery.where }));
  ctx.body = await spacesService.findMany(prismaQuery);
};
