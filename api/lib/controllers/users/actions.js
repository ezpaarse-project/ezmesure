const elastic = require('../../services/elastic');

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

exports.list = async (ctx) => {
  const search = ctx.query.q;
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
    _source: ['full_name', 'username'],
    body: { query },
  });

  const users = body.hits && body.hits.hits;

  if (!Array.isArray(users)) {
    ctx.throw(500, ctx.$t('errors.users.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = users.map((user) => user._source); // eslint-disable-line no-underscore-dangle
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
  });

  ctx.status = (result && result.found) ? 204 : 404;
  ctx.body = result;
};
