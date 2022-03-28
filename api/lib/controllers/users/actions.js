const config = require('config');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');

const Institution = require('../../models/Institution');

const depositorsIndex = config.depositors.index;

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

const ensureIndex = async () => {
  const { body: exists } = await elastic.indices.exists({ index: depositorsIndex });

  if (!exists) {
    await elastic.indices.create({
      index: depositorsIndex,
      body: indexTemplate,
    });
  }
};

exports.getUser = async (ctx) => {
  const { username } = ctx.params;

  const { body: user, statusCode } = await elastic.security.getUser(
    { username },
    { ignore: [404] },
  );

  if (statusCode === 404) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getUserOfInstitution = async (ctx) => {
  await ensureIndex();

  const { username } = ctx.request.params;

  const user = await elastic.security.findUser({ username });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notAssigned'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = institution;
};

exports.list = async (ctx) => {
  const search = ctx.query.q;

  const { user } = ctx.state;

  const { size = 10, source = 'full_name,username' } = ctx.query;

  if (source !== 'full_name,username' && !isAdmin(user)) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  const query = {
    bool: {
      filter: {
        term: { type: 'user' },
      },
    },
  };

  if (search) {
    query.bool.minimum_should_match = 1;
    query.bool.should = [
      { wildcard: { full_name: `*${search}*` } },
      { wildcard: { username: `*${search}*` } },
    ];
  }

  const { body = {} } = await elastic.search({
    index: '.security',
    _source: source,
    size,
    body: { query },
  });

  const users = body.hits && body.hits.hits;

  if (!Array.isArray(users)) {
    ctx.throw(500, ctx.$t('errors.users.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = users.map((u) => u._source); // eslint-disable-line no-underscore-dangle
};

exports.updateUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

  const { body: result } = await elastic.security.putUser({
    username,
    body,
    refresh: true,
  });

  ctx.status = (result && result.created) ? 201 : 200;
  ctx.body = result;
};

exports.deleteUser = async (ctx) => {
  const { username } = ctx.request.params;

  const { body: result } = await elastic.security.deleteUser({
    username,
    refresh: true,
  }, { ignore: [404] });

  ctx.status = 200;
  ctx.body = result;
};
