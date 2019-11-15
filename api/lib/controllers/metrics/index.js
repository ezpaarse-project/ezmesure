const router = require('koa-joi-router')();

const { overall } = require('./metrics');

router.get('/', overall);

module.exports = router;
