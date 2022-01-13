const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole,
} = require('../../services/auth');

const {
  getAll,
  getOne,
} = require('./actions');

router.use(requireJwt, requireUser, requireTermsOfUse, requireAnyRole(['sushi_form', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/:taskId',
  handler: getOne,
  validate: {
    params: {
      taskId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: {
      status: Joi.string().trim().min(1),
      type: Joi.string().trim().min(1),
      sushiId: Joi.string().trim().min(1),
      institutionId: Joi.string().trim().min(1),
    },
  },
});

module.exports = router;
