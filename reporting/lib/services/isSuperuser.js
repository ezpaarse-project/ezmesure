const logger = require('../logger');
const client = require('./elastic');

module.exports = async (ctx, next) => {
  const { user } = ctx.query;

  let currentUser;
  try {
    currentUser = await client.security.getUser({ username: user });
  } catch (error) {
    logger.error(error);
    ctx.status = 403;
    ctx.type = 'json';
    ctx.body = {
      error: 'You have no rights to access this page.',
      code: 403,
    };
  }
  
  currentUser = currentUser.body[user];

  const adminRoles = ['superuser', 'admin'];
  const hasRoles = currentUser.roles.some((role) => adminRoles.includes(role));

  if (!hasRoles) {
    ctx.status = 403;
    ctx.type = 'json';
    ctx.body = {
      error: 'You have no rights to access this page.',
      code: 403,
    }; 
  }
  
  if (hasRoles) {
    await next();
  }
};
