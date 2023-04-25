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
} = require('../../entities/repositories.dto');

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    params: {
      q: Joi.string(),
      type: Joi.string(),
      institutionId: Joi.string(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:repositoryId',
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
  path: '/:repositoryId',
  handler: [
    fetchRepository(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      repositoryId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:repositoryId',
  handler: [
    fetchRepository(),
    deleteOne,
  ],
  validate: {
    params: {
      repositoryId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
