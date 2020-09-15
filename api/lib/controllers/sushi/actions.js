const config = require('config');

const encrypter = require('../../services/encrypter');
const elastic = require('../../services/elastic');
const sushiPlatforms = require('../../utils/sushi.json');
const { appLogger } = require('../../../server');

const cryptedFields = ['requestorId', 'consortialId', 'customerId', 'apiKey'];

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = sushiPlatforms;
};

exports.addSushi = async (ctx) => {
  const { body } = ctx.request;

  ctx.status = 200;

  cryptedFields.forEach((field) => {
    if (body[field]) {
      body[field] = encrypter.encrypt(body[field]);
    }
  });

  try {
    await elastic.index({
      index: config.depositors.index,
      refresh: true,
      body,
    });
  } catch (err) {
    ctx.status = 500;
    appLogger.error('Failed to create new sushi credentials', err);
  }
};

exports.updateSushi = async (ctx) => {
  const { institutionId } = ctx.params;
  const { body } = ctx.request;

  ctx.status = 200;

  cryptedFields.forEach((field) => {
    if (body[field]) {
      body[field] = encrypter.encrypt(body[field]);
    }
  });

  await elastic.update({
    index: config.depositors.index,
    id: institutionId,
    refresh: true,
    body: {
      script: {
        source: 'def targets = ctx._source.sushi.findAll(sushi -> sushi.id == params.id);'
          + 'for(sushi in targets) {'
            + 'sushi.id = params.id;'
            + 'sushi.vendor = params.vendor;'
            + 'sushi.package = params.package;'
            + 'sushi.sushiUrl = params.sushiUrl;'
            + 'sushi.requestorId = params.requestorId;'
            + 'sushi.consortialId = params.consortialId;'
            + 'sushi.customerId = params.customerId;'
            + 'sushi.apiKey = params.apiKey;'
            + 'sushi.comment = params.comment;'
          + '}',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.deleteSushiData = async (ctx) => {
  const { institutionId } = ctx.params;
  const { body } = ctx.request;

  let institution = null;
  try {
    institution = await elastic.getSource({
      index: config.depositors.index,
      id: institutionId,
      refresh: true,
    });
  } catch (err) {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  }

  if (!institution || !institution.body) {
    ctx.status = 404;
    return;
  }

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
        // FIXME: use bulk query
        await elastic.update({
          index: config.depositors.index,
          id: institutionId,
          body: {
            script: {
              source: 'ctx._source.sushi.removeIf(sushi -> sushi.id == params.id)',
              params: {
                id: body.ids[i],
              },
            },
          },
        });
        response.push({ id: body.ids[i], status: 'deleted' });
      } catch (error) {
        response.push({ id: body.ids[i], status: 'failed' });
        appLogger.error('Failed to delete sushi data', error);
      }
    }

    ctx.status = 200;
    ctx.body = response;
  }
};
