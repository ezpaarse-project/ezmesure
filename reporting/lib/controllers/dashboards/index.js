const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const hasPrivileges = require('../../services/hasPrivileges');
const isSuperuser = require('../../services/isSuperuser');

const {
  getAll,
  getBySpace,
} = require('./actions');

router.get('/', isSuperuser, getAll);

router.get('/:space', {
  validate: {
    params: {
      space: Joi.string().trim(),
    },
  },
}, hasPrivileges(['read']), getBySpace);

module.exports = router;
