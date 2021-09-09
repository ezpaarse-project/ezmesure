const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const Institution = require('../../models/Institution');

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
} = require('./actions');

const {
  getInstitutionState,
  validateInstitution,
  deleteInstitutionCreator,
} = require('./admin');

/**
 * Middleware that fetches an institution and put it in ctx.state.institution
 * Assumes that the route param institutionId is present
 */
async function fetchInstitution(ctx, next) {
  const { institutionId } = ctx.params;

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notFound'));
    return;
  }

  ctx.state.institution = institution;
  await next();
}

/**
 * Middleware that checks that user is either admin or institution contact
 * Assumes that ctx.state contains institution and user
 */
function requireContact(opts = {}) {
  const { allowCreator } = opts;

  return (ctx, next) => {
    const { user, institution, userIsAdmin } = ctx.state;

    if (userIsAdmin) { return next(); }
    if (user && institution && institution.isContact(user)) { return next(); }
    if (allowCreator && user && institution && institution.isCreator(user)) { return next(); }

    ctx.throw(403, ctx.$t('errors.institution.unauthorized'));
    return undefined;
  };
}

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: [
    requireAnyRole(['sushi_form', 'admin', 'superuser']),
    fetchInstitution,
    requireContact(),
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
  handler: [
    fetchInstitution,
    getInstitution,
  ],
});

router.route({
  method: 'GET',
  path: '/:institutionId/members',
  handler: [
    fetchInstitution,
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
  method: 'PUT',
  path: '/:institutionId/members/:username',
  handler: [
    fetchInstitution,
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
    fetchInstitution,
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
    fetchInstitution,
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
    fetchInstitution,
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
    fetchInstitution,
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
    fetchInstitution,
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
    fetchInstitution,
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

router.route({
  method: 'POST',
  path: '/:institutionId/_refresh',
  handler: [
    fetchInstitution,
    refreshInstitution,
  ],
  validate: {
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
