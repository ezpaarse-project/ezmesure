const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireUser, requireJWT } = require('../../../services/auth');

const { redirectToFront } = require('./middlewares');

const {
  login,
  loginCallback,
  logout,
  refresh,
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

router.route({
  method: 'GET',
  path: '/logout',
  handler: [
    requireJWT,
    requireUser,
    redirectToFront,
    logout,
  ],
});

router.route({
  method: 'POST',
  path: '/refresh',
  handler: [
    requireJWT,
    requireUser,
    refresh,
  ],
});

module.exports = router;
