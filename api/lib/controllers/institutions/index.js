const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAnyRole,
  fetchInstitution,
  requireContact,
} = require('../../services/auth');

const {
  getInstitutions,
  createInstitution,
  deleteInstitution,
  getInstitution,
  getSelfInstitution,
  getInstitutionMembers,
  addInstitutionMember,
  removeInstitutionMember,
  updateInstitution,
  getSushiData,
  refreshInstitutions,
  refreshInstitution,
  getInstitutionContacts,
} = require('./actions');

const {
  getInstitutionState,
  validateInstitution,
  deleteInstitutionCreator,
} = require('./admin');

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: [
    requireAnyRole(['sushi_form', 'admin', 'superuser']),
    fetchInstitution(),
    requireContact(),
    getSushiData,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: {
      latestImportTask: Joi.boolean().default(false),
      connection: Joi.string().valid('working', 'faulty', 'untested'),
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
  handler: [
    fetchInstitution(),
    getInstitution,
  ],
});

router.route({
  method: 'GET',
  path: '/:institutionId/members',
  handler: [
    fetchInstitution(),
    requireContact(),
    getInstitutionMembers,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/contacts',
  handler: [
    fetchInstitution(),
    requireContact(),
    getInstitutionContacts,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/members/:username',
  handler: [
    fetchInstitution(),
    requireContact(),
    addInstitutionMember,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
    body: {
      readonly: Joi.boolean().default(true),
      docContact: Joi.boolean(),
      techContact: Joi.boolean(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/members/:username',
  handler: [
    fetchInstitution(),
    requireContact(),
    removeInstitutionMember,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: createInstitution,
  validate: {
    type: 'json',
    maxBody: '3mb',
    query: {
      creator: Joi.boolean(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId',
  handler: [
    fetchInstitution(),
    requireContact({ allowCreator: true }),
    updateInstitution,
  ],
  validate: {
    type: 'json',
    maxBody: '3mb',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/creator',
  handler: [
    fetchInstitution(),
    requireContact(),
    deleteInstitutionCreator,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'DELETE',
  path: '/:institutionId',
  handler: [
    fetchInstitution(),
    deleteInstitution,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/state',
  handler: [
    fetchInstitution(),
    getInstitutionState,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/validated',
  handler: [
    fetchInstitution(),
    validateInstitution,
  ],
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

module.exports = router;
