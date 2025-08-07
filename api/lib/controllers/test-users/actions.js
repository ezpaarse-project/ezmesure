const esUsers = require('../../services/elastic/users');
const {
  getAll,
  createTestUser,
  getManyByUsername,
  isTestUser,
} = require('../../services/elastic/test-users');

exports.getManyTestUsers = async (ctx) => {
  const { cloneOf = '' } = ctx.query;

  ctx.body = await (cloneOf ? getManyByUsername(cloneOf) : getAll());
  ctx.status = 200;
};

exports.createTestUser = async (ctx) => {
  const { cloneOf, lifespan } = ctx.request.body;

  const user = await esUsers.getUserByUsername(cloneOf);

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const testUser = await createTestUser(user, { lifespan });

  ctx.body = testUser;
  ctx.status = 200;
};

exports.deleteTestUser = async (ctx) => {
  const { username } = ctx.params;

  const user = await esUsers.getUserByUsername(username);

  if (user && !isTestUser(user)) {
    ctx.throw(409, ctx.$t('errors.user.notATestUser'));
  }

  if (user) {
    await esUsers.deleteUser(user.username);
  }

  ctx.status = 204;
};
