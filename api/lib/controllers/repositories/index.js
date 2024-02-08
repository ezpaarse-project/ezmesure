const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  fetchRepository,
  requireAdmin,
} = require('../../services/auth');

const {
  getMany,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./actions');

const {
  adminCreateSchema,
  adminUpdateSchema,
  includableFields,
} = require('../../entities/repositories.dto');

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    query: Joi.object({
      size: Joi.number().integer().min(-1),
      q: Joi.string(),
      type: Joi.string(),
      institutionId: Joi.string(),
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    getOne,
  ],
});

router.route({
  method: 'POST',
  path: '/',
  handler: createOne,
  validate: {
    type: 'json',
    body: adminCreateSchema,
  },
});

router.route({
  method: 'PATCH',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    deleteOne,
  ],
  validate: {
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
