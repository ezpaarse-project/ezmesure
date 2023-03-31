const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  requireContact,
  requireAdmin,
} = require('../../services/auth');

const {
  getInstitutions,
  createInstitution,
  deleteInstitution,
  getInstitution,
  getInstitutionMembers,
  addInstitutionMember,
  removeInstitutionMember,
  updateInstitution,
  getSushiData,
  getInstitutionContacts,
} = require('./actions');

const {
  getInstitutionState,
  validateInstitution,
} = require('./admin');

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: [
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
  path: '/:institutionId',
  handler: [
    fetchInstitution(),
    getInstitution,
  ],
});

router.route({
  method: 'GET',
  path: '/:institutionId/memberships',
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
  path: '/:institutionId/memberships/:username',
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
      isDocContact: Joi.boolean().default(false),
      isTechContact: Joi.boolean().default(false),
      isGuest: Joi.boolean().default(false),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/memberships/:username',
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
      addAsMember: Joi.boolean(),
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

router.use(requireAdmin);

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
