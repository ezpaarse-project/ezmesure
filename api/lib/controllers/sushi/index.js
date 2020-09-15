const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  getAll,
  deleteSushiData,
  updateSushi,
  addSushi,
} = require('./actions');

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
});

router.route({
  method: 'POST',
  path: '/delete',
  handler: deleteSushiData,
  validate: {
    type: 'json',
    body: {
      ids: Joi.array().items(Joi.string().trim()),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: addSushi,
  validate: {
    type: 'json',
    body: {
      institutionId: Joi.string().trim().required(),
      vendor: Joi.string().trim().required(),
      package: Joi.string().trim().required(),
      sushiUrl: Joi.string().trim().required(),
      requestorId: Joi.string().trim().empty(''),
      consortialId: Joi.string().trim().empty(''),
      customerId: Joi.string().trim().empty(''),
      apiKey: Joi.string().trim().empty(''),
      comment: Joi.string().trim().empty(''),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:sushiId',
  handler: updateSushi,
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: {
      vendor: Joi.string().trim().required(),
      package: Joi.string().trim().required(),
      sushiUrl: Joi.string().trim().required(),
      requestorId: Joi.string().trim().empty(''),
      customerId: Joi.string().trim().empty(''),
      apiKey: Joi.string().trim().empty(''),
      comment: Joi.string().trim().empty(''),
    },
  },
});

module.exports = router;
