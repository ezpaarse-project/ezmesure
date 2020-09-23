const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');
const { appLogger } = require('../../../server');

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await Sushi.findAll();
};

exports.addSushi = async (ctx) => {
  const { body } = ctx.request;

  const institution = await Institution.findById(body.institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  const sushiItem = new Sushi(body);
  await sushiItem.save();

  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { body } = ctx.request;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, 'Sushi item not found');
    return;
  }

  // TODO: check that the user is either admin or correspondent

  sushiItem.update(body);

  try {
    await sushiItem.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
};

exports.deleteSushiData = async (ctx) => {
  const { body } = ctx.request;

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
        // FIXME: use bulk query
        // TODO: check that the user is either admin or correspondent
        await Sushi.deleteOne(body.ids[i]);
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
