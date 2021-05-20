const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  listDashboards,
} = require('./actions');

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: listDashboards,
  validate: {
    query: {
      space: Joi.string().trim(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/_export',
  handler: exportDashboard,
  validate: {
    query: {
      space: Joi.string().trim(),
      dashboard: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
