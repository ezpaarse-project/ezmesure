const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');
const { appLogger } = require('../../../server');

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

exports.getAll = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  const { user } = ctx.state;

  if (!isAdmin(user)) {
    ctx.throw(403, 'You are not authorized to access this route');
    return;
  }

  ctx.body = await Sushi.findAll();
};

exports.addSushi = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findById(body.institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  if (!isAdmin(user)) {
    if (!institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage the sushi credentials of this institution');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  const sushiItem = new Sushi(body);
  await sushiItem.save();

  ctx.status = 201;
  ctx.body = sushiItem;
};

exports.updateSushi = async (ctx) => {
  const { sushiId } = ctx.params;
  const { user } = ctx.state;
  const { body } = ctx.request;

  const sushiItem = await Sushi.findById(sushiId);

  if (!sushiItem) {
    ctx.throw(404, 'Sushi item not found');
    return;
  }

  if (!isAdmin(user)) {
    const institution = await sushiItem.getInstitution();

    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage the sushi credentials of this institution');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  sushiItem.update(body);

  try {
    await sushiItem.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = sushiItem;
};

exports.deleteSushiData = async (ctx) => {
  const { body } = ctx.request;
  const { user } = ctx.state;

  const institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);

  if (!isAdmin(user)) {
    if (!institution || !institution.isContact(user)) {
      ctx.throw(403, 'You are not authorized to manage sushi credentials');
      return;
    }
    if (!institution.isValidated()) {
      ctx.throw(400, 'Cannot manage sushi credentials : institution is not validated');
      return;
    }
  }

  const sushiItems = await Sushi.findManyById(body.ids);

  const response = await Promise.all(sushiItems.map(async (sushiItem) => {
    if (!isAdmin(user) && (sushiItem.getInstitutionId() !== institution.id)) {
      return { id: sushiItem.id, status: 'failed' };
    }


    try {
      await sushiItem.delete();
      return { id: sushiItem.id, status: 'deleted' };
    } catch (error) {
      appLogger.error('Failed to delete sushi data', error);
      return { id: sushiItem.id, status: 'failed' };
    }
  }));

  ctx.status = 200;
  ctx.body = response;
};
