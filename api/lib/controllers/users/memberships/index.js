const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveAuth,
  requireUser,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getUserMemberships: getInstitutionMembers,
} = require('./actions');

router.use(requireActiveAuth, requireUser, requireAdmin);

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
