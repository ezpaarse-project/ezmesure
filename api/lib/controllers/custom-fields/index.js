const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,
  getMany,
  getOne,
  upsertOne,
  deleteOne,
} = require('./actions');

const {
  adminUpsertSchema,
} = require('../../entities/custom-fields.dto');

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:fieldId',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      fieldId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/:fieldId',
  handler: upsertOne,
  validate: {
    type: 'json',
    body: adminUpsertSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:fieldId',
  handler: deleteOne,
  validate: {
    params: {
      fieldId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
