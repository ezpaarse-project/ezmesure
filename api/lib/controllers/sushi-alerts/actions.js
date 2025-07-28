const SushiAlertsService = require('../../entities/sushi-alerts.service');
const { schema } = require('../../entities/sushi-alerts.dto');

const { startUpdateEndpointAlerts, startUpdateHarvestButUnsupportedAlerts } = require('../../services/sushi-alerts');

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  queryFields: [],
});
exports.standardQueryParams = standardQueryParams;

/**
 * @typedef {object} Alert
 * @property {string} type
 * @property {'info'|'warn'|'error'} severity
 * @property {object} data
 */

exports.getAllAlerts = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const service = new SushiAlertsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await service.count({ where: prismaQuery.where }));
  ctx.body = await service.findMany(prismaQuery);
};

exports.getOneAlert = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

  const service = new SushiAlertsService();
  const alert = await service.findUnique(prismaQuery);

  if (!alert) {
    ctx.throw(404, ctx.$t('errors.alert.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = alert;
};

exports.deleteOneAlert = async (ctx) => {
  const { id } = ctx.params;

  const service = new SushiAlertsService();
  const data = await service.delete({ where: { id } });

  ctx.status = 200;
  ctx.body = data;
};

exports.refreshUnsupportedButHarvestedUpdateAlerts = async (ctx) => {
  await startUpdateHarvestButUnsupportedAlerts();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = { acknowledged: true };
};

exports.refreshEndpointAlerts = async (ctx) => {
  await startUpdateEndpointAlerts();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = { acknowledged: true };
};
