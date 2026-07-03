const router = require('koa-joi-router')();

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { stringOrArrayValidation } = require('../../services/std-query');

const {
  standardQueryParams,
  getMany,
} = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

router.route({
  method: 'POST',
  path: '/_search',
  handler: getMany,
  validate: {
    type: 'json',
    body: standardQueryParams.manyValidation.append({
      roleId: stringOrArrayValidation,
    }),
  },
});

module.exports = router;
