const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  list,
  listIndexPatterns,
  createSpace,
} = require('./actions');

const spaceIdPattern = /^[a-z0-9][a-z0-9_.-]*$/i;

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: list,
});

router.route({
  method: 'GET',
  path: '/:spaceId/index-patterns',
  handler: listIndexPatterns,
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:spaceId',
  handler: createSpace,
  validate: {
    type: 'json',
    params: {
      spaceId: Joi.string().trim().required().regex(spaceIdPattern),
    },
    body: {
      id: Joi.any().strip(),
      name: Joi.string().trim(),
      description: Joi.string().trim(),
      initials: Joi.string().trim().min(1).max(2),
      color: Joi.string().trim().regex(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i),
    },
  },
});

module.exports = router;
