const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser } = require('../../../services/auth');

const { redirectToFront } = require('./middlewares');

const {
  login,
  loginCallback,
  logout,
} = require('./actions');

router.route({
  method: 'GET',
  path: '/login',
  handler: [
    redirectToFront,
    login,
  ],
  validate: {
    query: {
      origin: Joi.string().optional(),
      refresh: Joi.string().optional(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/login/callback',
  handler: [
    redirectToFront,
    loginCallback,
  ],
});

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/logout',
  handler: [
    redirectToFront,
    logout,
  ],
});

module.exports = router;
