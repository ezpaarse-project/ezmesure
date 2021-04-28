const elastic = require('../../services/elastic');

exports.list = async function (ctx) {
  ctx.action = 'indices/list';
  ctx.type = 'json';

  const { body } = await elastic.indices.stats({
    metric: 'docs',
  }, {
    headers: { 'es-security-runas-user': ctx.state.user.username },
  });

  ctx.body = body;
};

exports.deleteIndice = async function (ctx) {
  const { index } = ctx.request.params;
  ctx.action = 'indices/delete';
  ctx.index = index;
  const { username } = ctx.state.user;
  const { body: perm } = await elastic.security.hasPrivileges({
    username,
    body: {
      index: [{ names: [index], privileges: ['delete_index'] }],
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index].delete_index;

  if (!canDelete) {
    ctx.throw(403, ctx.$t('errors.perms.deleteIndex', index));
  }

  const { body } = await elastic.indices.delete({
    index,
  }, {
    headers: { 'es-security-runas-user': username },
  });

  ctx.type = 'json';
  ctx.body = body;
};

exports.deleteEvents = async function (ctx) {
  const { index } = ctx.request.params;
  ctx.action = 'events/delete';
  ctx.index = index;
  const { username } = ctx.state.user;
  const { body: perm } = await elastic.security.hasPrivileges({
    username,
    body: {
      index: [{ names: [index], privileges: ['delete_index'] }],
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index].delete_index;

  if (!canDelete) {
    ctx.throw(403, ctx.$t('errors.perms.deleteFrom', index));
  }

  const query = {};
  const { from, to } = ctx.query;

  if (from || to) {
    query.range = { datetime: {} };

    if (from) { query.range.datetime.gte = from; }
    if (to) { query.range.datetime.lte = to; }
  }

  if (Object.keys(query).length === 0) {
    query.match_all = {};
  }

  const { body } = await elastic.deleteByQuery({
    index,
    body: { query },
  }, {
    headers: { 'es-security-runas-user': username },
  });

  ctx.type = 'json';
  ctx.body = body;
};

/**
 * Return aggregated metrics for a given index pattern
 */
exports.tops = async function (ctx) {
  const { index } = ctx.request.params;
  ctx.action = 'indices/tops';
  ctx.type = 'json';
  ctx.index = index;
  const { username } = ctx.state.user;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  let size = Number.parseInt(ctx.query.size, 10);

  if (Number.isNaN(size)) {
    size = 10;
  } else {
    size = Math.min(Math.abs(size), 50);
  }

  const dateRange = {
    min: new Date(0),
    max: now,
  };

  switch (ctx.query.period || 'all') {
    case 'today':
      dateRange.min = new Date(currentYear, currentMonth, currentDate);
      break;
    case 'yesterday':
      dateRange.min = new Date(currentYear, currentMonth, currentDate - 2);
      dateRange.max = new Date(currentYear, currentMonth, currentDate - 1);
      break;
    case 'current_week':
      dateRange.min = new Date(currentYear, currentMonth, currentDate - 7);
      break;
    case 'last_week':
      dateRange.min = new Date(currentYear, currentMonth, currentDate - 14);
      dateRange.max = new Date(currentYear, currentMonth, currentDate - 7);
      break;
    case 'current_month':
      dateRange.min = new Date(currentYear, currentMonth, 1);
      break;
    case 'last_month':
      dateRange.min = new Date(currentYear, currentMonth - 1, 1);
      dateRange.max = new Date(currentYear, currentMonth, 1);
      break;
    case 'current_year':
      dateRange.min = new Date(currentYear, 0, 1);
      break;
    case 'last_year':
      dateRange.min = new Date(currentYear - 1, 0, 1);
      dateRange.max = new Date(currentYear, 0, 1);
      break;
    case 'all':
      break;
    default:
      ctx.throw(400, ctx.$t('errors.aggregate.invalidPeriod'));
      break;
  }

  const { body: result } = await elastic.search({
    index,
    body: {
      size: 0,
      query: {
        bool: {
          must: [{
            range: {
              datetime: {
                gte: dateRange.min.getTime(),
                lte: dateRange.max.getTime(),
                format: 'epoch_millis',
              },
            },
          }],
        },
      },
      aggs: {
        indices: { terms: { field: '_index', size } },
        titles: { terms: { field: 'publication_title', size } },
        publishers: { terms: { field: 'publisher_name', size } },
        maxDate: { max: { field: 'datetime' } },
        minDate: { min: { field: 'datetime' } },
      },
    },
  }, {
    headers: { 'es-security-runas-user': username },
  });

  const {
    took,
    hits = {},
    aggregations = {},
  } = result;

  const {
    titles = {},
    publishers = {},
    indices = {},
    minDate = {},
    maxDate = {},
  } = aggregations;

  ctx.body = {
    took,
    docs: hits.total,
    dateCoverage: {
      min: minDate.value,
      max: maxDate.value,
    },
    tops: {
      titles: titles.buckets,
      publishers: publishers.buckets,
      indices: indices.buckets,
    },
  };
};
