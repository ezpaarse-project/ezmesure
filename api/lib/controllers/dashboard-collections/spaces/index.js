const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getCollectionSpaces,
} = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getCollectionSpaces,
  validate: {
    params: {
      collectionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

module.exports = router;
