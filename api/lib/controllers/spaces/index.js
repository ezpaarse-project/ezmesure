const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  list,
  listIndexPatterns,
  createSpace,
  createIndexPattern,
  getSpace,
} = require('./actions');

const spaceIdPattern = /^[a-z0-9][a-z0-9_.-]*$/i;
const indexPatternRegex = /^[a-z0-9][a-z0-9_.-]*\*?$/;

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: list,
});

router.route({
  method: 'GET',
  path: '/:spaceId',
  handler: getSpace,
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
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
  method: 'POST',
  path: '/',
  handler: createSpace,
  validate: {
    type: 'json',
    body: {
      id: Joi.string().trim().required().regex(spaceIdPattern),
      name: Joi.string().trim(),
      description: Joi.string().trim(),
      initials: Joi.string().trim().min(1).max(2),
      color: Joi.string().trim().regex(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:spaceId/index-patterns',
  handler: createIndexPattern,
  validate: {
    type: 'json',
    params: {
      spaceId: Joi.string().trim().required().regex(spaceIdPattern),
    },
    body: {
      title: Joi.string().trim().regex(indexPatternRegex).required(),
      timeFieldName: Joi.string().trim().default('datetime'),
    },
  },
});

module.exports = router;
