const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { bodyParser } = require('@koa/bodyparser');

const { requireAuth, requireUserOrInstitution, requireTermsOfUse } = require('../../services/auth');

const {
  list,
  deleteIndice,
  deleteEvents,
  tops,
} = require('./basics');

const search = require('./search');
const upload = require('./upload');

const { aggregate, counter5 } = require('./export');

router.use(requireAuth, requireUserOrInstitution, requireTermsOfUse);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    list,
  ],
});

router.route({
  method: 'GET',
  path: '/:index/tops',
  handler: [
    tops,
  ],
});

router.route({
  method: 'DELETE',
  path: '/:index',
  handler: [
    deleteIndice,
  ],
});

router.route({
  method: 'DELETE',
  path: '/:index/events',
  handler: [
    deleteEvents,
  ],
});

router.route({
  method: 'POST',
  path: '/:index',
  handler: [
    upload,
  ],
});

router.route({
  method: 'GET',
  path: '/:index/aggregation.:extension',
  handler: [
    aggregate,
  ],
  validate: {
    params: {
      index: Joi.string().trim().min(1),
      extension: Joi.string().valid('csv', 'ndjson'),
    },
    query: {
      fields: Joi.string().required().trim().min(1),
      filter: Joi.string().trim(),
      delimiter: Joi.string().trim(),
      from: Joi.string(),
      to: Joi.string(),
      missing: Joi.boolean(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:index/counterize',
  handler: [
    counter5,
  ],
  validate: {
    type: 'json',
    params: {
      index: Joi.string().trim().min(1),
    },
    body: {
      destination: Joi.string().required().trim().min(1),
      platform: Joi.string().trim(),
      from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      sessionField: Joi.string().min(1),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:index/search',
  handler: [
    bodyParser(),
    search,
  ],
});

module.exports = router;
