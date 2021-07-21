const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const handleElasticErrors = require('../../utils/elastic-error-handler');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const { list, getUser, updateUser } = require('./actions');

router.use(requireJwt, requireUser);

router.get('/', [handleElasticErrors, list]);

router.route({
  method: 'GET',
  path: '/:username',
  handler: [handleElasticErrors, getUser],
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'PUT',
  path: '/:username',
  handler: [handleElasticErrors, updateUser],
  validate: {
    type: 'json',
    params: {
      username: Joi.string().trim().required(),
    },
    body: {
      username: Joi.any().strip(),
      enabled: Joi.boolean(),
      email: Joi.string().trim().email(),
      full_name: Joi.string().trim(),
      metadata: Joi.object().unknown(true),
      password: Joi.string().trim(),
      roles: Joi.array().items(Joi.string().trim()).required(),
    },
  },
});

module.exports = router;
