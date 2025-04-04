const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAdmin,
} = require('../../../services/auth');

const {
  getAll,
  getOne,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAdmin,
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getAll,
  ],
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      id: Joi.string(),
    },
  },
});

module.exports = router;
