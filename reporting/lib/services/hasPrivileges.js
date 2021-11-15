const { index } = require('config');
const elastic = require('./elastic');

module.exports = (privileges) => {
  return async (ctx, next) => {
    const { user } = ctx.query;

    if (!user) {
      ctx.status = 400;
      ctx.type = 'json';
      ctx.body = {
        error: 'No user specified.',
        code: 400,
      };
      return;
    }

    try {
      const { body: perm } = await elastic.security.hasPrivileges({
        user,
        body: {
          index: [{ names: [index], privileges }],
        },
      }, {
        headers: { 'es-security-runas-user': user },
      });

      const perms = (perm && perm.index && perm.index[index]) || {};
      const canMakeAction = privileges.every((privilege) => perms[privilege]);

      if (canMakeAction) {
        await next();
      } else {
        ctx.status = 403;
        ctx.type = 'json';
        ctx.body = {
          error: 'You have no rights to access this page.',
          code: 403,
        };
      }
    } catch (e) {
      ctx.status = 403;
      ctx.type = 'json';
      ctx.body = {
        error: 'You are not authorize to access this page.',
        code: 403,
      };
    }
  };
};
