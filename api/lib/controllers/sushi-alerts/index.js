const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  standardQueryParams,

  getAllAlerts,
  getOneAlert,
  deleteOneAlert,
  getUnsupportedButHarvestedState,
  refreshUnsupportedButHarvestedUpdateAlerts,
  getEndpointState,
  refreshEndpointAlerts,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAllAlerts,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: getOneAlert,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'DELETE',
  path: '/:id',
  handler: deleteOneAlert,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/_refresh/HARVESTED_BUT_UNSUPPORTED',
  handler: getUnsupportedButHarvestedState,
});

router.route({
  method: 'POST',
  path: '/_refresh/HARVESTED_BUT_UNSUPPORTED',
  handler: refreshUnsupportedButHarvestedUpdateAlerts,
});

router.route({
  method: 'GET',
  path: '/_refresh/ENDPOINT',
  handler: getEndpointState,
});

router.route({
  method: 'POST',
  path: '/_refresh/ENDPOINT',
  handler: refreshEndpointAlerts,
});

module.exports = router;
