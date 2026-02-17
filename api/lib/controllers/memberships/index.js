const router = require('koa-joi-router')();

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { stringOrArrayValidation } = require('../../services/std-query');

const {
  standardQueryParams,
  getMany,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

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
