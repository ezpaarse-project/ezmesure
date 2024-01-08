const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { bodyParser } = require('@koa/bodyparser');

const { requireJwt, requireUser, requireTermsOfUse } = require('../../services/auth');

const {
  list, deleteIndice, deleteEvents, tops,
} = require('./basics');
const search = require('./search');
const upload = require('./upload');
const { aggregate, counter5 } = require('./export');

router.use(requireJwt, requireUser, requireTermsOfUse);

router.get('/', list);
router.get('/:index/tops', tops);
router.delete('/:index', deleteIndice);
router.delete('/:index/events', deleteEvents);
router.post('/:index', upload);

router.route({
  method: 'GET',
  path: '/:index/aggregation.:extension',
  handler: aggregate,
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
  handler: counter5,
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
router.use(bodyParser());
router.post('/:index/search', search);

module.exports = router;
