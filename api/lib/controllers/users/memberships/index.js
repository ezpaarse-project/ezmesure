const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getUserMemberships: getInstitutionMembers,
} = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

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
