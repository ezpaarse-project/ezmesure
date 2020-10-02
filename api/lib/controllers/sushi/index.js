const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const sushiPlatforms = require('../../utils/sushi.json');
const Sushi = require('../../models/Sushi');
const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireRole,
} = require('../../services/auth');

const {
  getAll,
  deleteSushiData,
  updateSushi,
  addSushi,
} = require('./actions');

router.use(requireJwt, requireUser, requireTermsOfUse, requireRole('beta_tester'));

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
});

router.route({
  method: 'GET',
  path: '/platforms.json',
  handler: (ctx) => {
    ctx.type = 'json';
    ctx.status = 200;
    ctx.body = sushiPlatforms;
  },
});

router.route({
  method: 'POST',
  path: '/batch_delete',
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
    body: Sushi.createSchema,
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
    body: Sushi.updateSchema,
  },
});

module.exports = router;
