const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');

const {
  getInstitutions,
  createInstitution,
  deleteInstitutions,
  deleteInstitution,
  validateInstitution,
  getInstitution,
  getSelfInstitution,
  getInstitutionMembers,
  updateInstitution,
  updateMember,
  getSushiData,
  refreshInstitutions,
  refreshInstitution,
} = require('./actions');

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: [
    requireAnyRole(['sushi_form', 'admin', 'superuser']),
    getSushiData,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/self',
  handler: [
    requireAnyRole(['institution_form', 'sushi_form', 'admin', 'superuser']),
    getSelfInstitution,
  ],
});

router.use(requireAnyRole(['institution_form', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/:institutionId',
  handler: getInstitution,
});

router.route({
  method: 'GET',
  path: '/:institutionId/members',
  handler: getInstitutionMembers,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(bodyParser());

router.route({
  method: 'POST',
  path: '/',
  handler: createInstitution,
  validate: {
    type: 'json',
    query: {
      creator: Joi.boolean(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId',
  handler: updateInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'DELETE',
  path: '/:institutionId',
  handler: deleteInstitution,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/delete',
  handler: deleteInstitutions,
  validate: {
    type: 'json',
    body: {
      ids: Joi.array().items(Joi.string().trim()),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/validated',
  handler: validateInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      value: Joi.boolean().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:institutionId/_refresh',
  handler: refreshInstitution,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_refresh',
  handler: refreshInstitutions,
});

module.exports = router;
