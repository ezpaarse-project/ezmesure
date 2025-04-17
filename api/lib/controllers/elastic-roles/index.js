const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  schema,
  adminUpdateSchema,
} = require('../../entities/elastic-roles.dto');

const {
  standardQueryParams,

  listRoles,
  getRole,
  upsertRole,
  deleteRole,
  importRoles,
  connectRepository,
  disconnectRepository,
  connectRepositoryAlias,
  disconnectRepositoryAlias,
  connectSpace,
  disconnectSpace,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: listRoles,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:name',
  handler: getRole,
  validate: {
    params: {
      name: schema.name,
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'DELETE',
  path: '/:name',
  handler: deleteRole,
  validate: {
    params: {
      name: schema.name,
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:name',
  handler: upsertRole,
  validate: {
    type: 'json',
    params: {
      name: schema.name,
    },
    body: adminUpdateSchema,
  },
});

router.route({
  method: 'PUT',
  path: '/:name/repository-permissions/:pattern',
  handler: connectRepository,
  validate: {
    type: 'json',
    params: {
      name: schema.name,
      pattern: Joi.string(),
    },
    body: {
      readonly: Joi.bool(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:name/repository-permissions/:pattern',
  handler: disconnectRepository,
  validate: {
    params: {
      name: schema.name,
      pattern: Joi.string(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:name/repository-alias-permissions/:pattern',
  handler: connectRepositoryAlias,
  validate: {
    type: 'json',
    params: {
      name: schema.name,
      pattern: Joi.string(),
    },
    body: {},
  },
});

router.route({
  method: 'DELETE',
  path: '/:name/repository-alias-permissions/:pattern',
  handler: disconnectRepositoryAlias,
  validate: {
    params: {
      name: schema.name,
      pattern: Joi.string(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:name/space-permissions/:id',
  handler: connectSpace,
  validate: {
    type: 'json',
    params: {
      name: schema.name,
      id: Joi.string(),
    },
    body: {
      readonly: Joi.bool(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:name/space-permissions/:id',
  handler: disconnectSpace,
  validate: {
    params: {
      name: schema.name,
      id: Joi.string(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: importRoles,
  validate: {
    type: 'json',
    params: {
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array(),
  },
});

module.exports = router;
