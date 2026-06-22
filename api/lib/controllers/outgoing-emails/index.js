const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  deleteOne,
} = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: getOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'DELETE',
  path: '/:id',
  handler: deleteOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
