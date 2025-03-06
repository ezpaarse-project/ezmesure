const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getUserMemberships: getInstitutionMembers,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getInstitutionMembers,
  ],
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

module.exports = router;
