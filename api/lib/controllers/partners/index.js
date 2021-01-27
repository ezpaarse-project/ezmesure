const router = require('koa-joi-router')();
const { list } = require('./actions');


router.get('/', list);

module.exports = router;
