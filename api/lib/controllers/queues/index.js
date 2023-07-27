const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  pauseOne,
  resumeOne,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
});

router.route({
  method: 'GET',
  path: '/:queueId',
  handler: getOne,
  validate: {
    params: {
      queueId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:queueId/_pause',
  handler: pauseOne,
  validate: {
    params: {
      queueId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:queueId/_resume',
  handler: resumeOne,
  validate: {
    params: {
      queueId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
