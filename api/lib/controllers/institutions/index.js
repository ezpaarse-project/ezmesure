const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const koaBody = require('koa-body');
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  getInstitutions,
  storeInstitution,
  deleteInstitutions,
  deleteInstitution,
  getInstitution,
  getSelfInstitution,
  getInstitutionMembers,
  updateInstitution,
  updateMember,
  getSelfMember,
  addSushi,
  updateSushi,
  getSushiData,
  deleteSushiData,
  pictures,
} = require('./actions');

router.get('/pictures/:id', pictures);

router.use(requireJwt, requireUser);

router.get('/', getInstitutions);

router.route({
  method: 'GET',
  path: '/pictures/:id',
  handler: pictures,
  validate: {
    params: {
      id: Joi.string().trim().min(16).max(16)
        .required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId',
  handler: getInstitution,
});
router.route({
  method: 'GET',
  path: '/self',
  handler: getSelfInstitution,
});

router.route({
  method: 'GET',
  path: '/members/self',
  handler: getSelfMember,
});

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: getSushiData,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
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

router.use(bodyParser());

router.route({
  method: 'POST',
  path: '/:institutionId/sushi',
  handler: addSushi,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      vendor: Joi.string().trim().required(),
      package: Joi.string().trim().required(),
      sushiUrl: Joi.string().trim().required(),
      requestorId: Joi.string().trim().empty(''),
      consortialId: Joi.string().trim().empty(''),
      customerId: Joi.string().trim().empty(''),
      apiKey: Joi.string().trim().empty(''),
      comment: Joi.string().trim().empty(''),
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
  method: 'POST',
  path: '/:institutionId/sushi/delete',
  handler: deleteSushiData,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      ids: Joi.array().items(Joi.string().trim().guid({ version: ['uuidv4'] })),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:institutionId/members/:email',
  handler: updateMember,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      email: Joi.string().trim().allow('self').email()
        .required(),
    },
    body: {
      id: Joi.string().trim().guid({ version: ['uuidv4'] }).required(),
      type: Joi.array().items(Joi.string().trim().valid('tech', 'doc')),
      email: Joi.string().trim().required(),
      confirmed: Joi.boolean().required(),
      fullName: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:institutionId/sushi',
  handler: updateSushi,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      id: Joi.string().trim().guid({ version: ['uuidv4'] }).required(),
      vendor: Joi.string().trim().required(),
      package: Joi.string().trim().required(),
      sushiUrl: Joi.string().trim().required(),
      requestorId: Joi.string().trim().empty(''),
      customerId: Joi.string().trim().empty(''),
      apiKey: Joi.string().trim().empty(''),
      comment: Joi.string().trim().empty(''),
    },
  },
});

router.use(koaBody({
  multipart: true,
  uploadDir: './uploads/',
}));

router.route({
  method: 'POST',
  path: '/',
  handler: storeInstitution,
  validate: {
    type: 'multipart',
  },
});

router.route({
  method: 'PATCH',
  path: '/:institutionId',
  handler: updateInstitution,
  validate: {
    type: 'multipart',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
