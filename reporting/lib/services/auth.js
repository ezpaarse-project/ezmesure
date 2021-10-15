const requireAnyRole = (role) => async (ctx, next) => {
  // const { user } = ctx.params;

  // const roles = Array.isArray(role) ? role : [role];

  // if (!Array.isArray(user && user.roles) || !user.roles.some((r) => roles.includes(r))) {
  //   ctx.throw(403, 'You are not authorized to use this feature');
  // }

  await next();
};

module.exports = {
  requireAnyRole,
};
