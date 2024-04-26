const router = require('koa-joi-router')();

const { standardQueryParams, getAll } = require('./actions');

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAdmin,
} = require('../../services/auth');

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAdmin,
);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

module.exports = router;
