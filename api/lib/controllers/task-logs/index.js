const router = require('koa-joi-router')();

const { standardQueryParams, getAll } = require('./actions');

const {
  requireActiveJwt,
  requireUser,
  requireTermsOfUse,
  requireAdmin,
} = require('../../services/auth');

router.use(
  requireActiveJwt,
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
