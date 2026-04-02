const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { bodyParser } = require('@koa/bodyparser');

const { requireJwt, requireUser } = require('../../../services/auth');

const {
  activateCurrentUser,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'POST',
  path: '/',
  handler: [
    bodyParser(),
    activateCurrentUser,
  ],
  validate: {
    type: 'json',
    body: Joi.object({
      acceptTerms: Joi.boolean().valid(true).required(),
    }),
  },
});

module.exports = router;
