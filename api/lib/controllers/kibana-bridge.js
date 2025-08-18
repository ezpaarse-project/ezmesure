const router = require('koa-joi-router')();
const { parse: parseCookie } = require('cookie');

const { requireJwt, requireUser } = require('../services/auth');
const { appLogger } = require('../services/logger');

const { setRandomPasswordForUser } = require('../services/elastic/users');
const { loginUser } = require('../services/kibana');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    async (ctx) => {
      const { user } = ctx.state;
      const { next, msg } = ctx.query;

      if (msg === 'LOGGED_OUT') {
        // We logged out of Kibana, so we're redirecting to the main app
        ctx.redirect('/myspace');
        return;
      }

      let esUser;
      try {
        esUser = await setRandomPasswordForUser(user.username);
      } catch (err) {
        appLogger.error('Failed to update password');

        const b64Err = Buffer.from(JSON.stringify(err)).toString('base64');
        ctx.redirect(`/?error=${b64Err}`);
        return;
      }

      let cookies = [];
      try {
        const res = await loginUser(esUser.username, esUser.password, ctx.href);
        cookies = res.headers['set-cookie'].map((str) => parseCookie(str));
      } catch (err) {
        appLogger.error('Failed to login into kibana');

        const b64Err = Buffer.from(JSON.stringify(err)).toString('base64');
        ctx.redirect(`/?error=${b64Err}`);
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const cookie of cookies) {
        const [[name, value], ...params] = Object.entries(cookie);
        ctx.cookies.set(name, value, Object.fromEntries(params));
      }

      ctx.redirect(next || '/spaces/space_selector');
    },
  ],
});

module.exports = router;
