const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  standardQueryParams,
  getAll,
  getOne,
} = require('./actions');

router.route({
  method: 'GET',
  path: '/',
  handler: [getAll],
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: [getOne],
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

module.exports = router;
