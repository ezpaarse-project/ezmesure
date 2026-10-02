const router = require('koa-joi-router')();

const { Joi } = require('koa-joi-router');
const { requireActiveJwt, requireUser, requireAdmin } = require('../../services/auth');
const { getLevels } = require('../../services/logger');

const twentyDaysInSeconds = 20 * 24 * 60 * 60;

const {
  getConfig,
} = require('./actions');

const {
  setLoggingLevel,
  getLoggingLevel,
} = require('./logging');

router.route({
  method: 'GET',
  path: '/',
  handler: getConfig,
});

router.use(requireActiveJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/logging',
  handler: getLoggingLevel,
});

router.route({
  method: 'PUT',
  path: '/logging/level',
  handler: setLoggingLevel,
  validate: {
    type: 'json',
    body: Joi.object({
      value: Joi.string().valid(...getLevels('app')),
      duration: Joi.number().required().min(1).max(twentyDaysInSeconds),
    }),
  },
});

module.exports = router;
