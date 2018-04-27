const elasticsearch = require('../../services/elastic');

exports.list = async function (ctx) {
  ctx.action = 'indices/list';
  ctx.type   = 'json';
  ctx.body   = await elasticsearch.indices.stats({
    metric: 'docs',
    headers: { 'es-security-runas-user': ctx.state.user.username }
  });
};

exports.del = async function (ctx, index) {
  ctx.action = 'indices/delete';
  ctx.index  = index;
  const username  = ctx.state.user.username;
  const perm      = await elasticsearch.hasPrivileges(username, [index], ['delete_index']);
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index]['delete_index'];

  if (!canDelete) {
    return ctx.throw(403, `you don't have permission to delete ${index}`);
  }

  ctx.type = 'json';
  ctx.body = await elasticsearch.indices.delete({
    index,
    headers: { 'es-security-runas-user': username }
  });
};

/**
 * Return aggregated metrics for a given index pattern
 */
exports.tops = async function (ctx, index) {
  ctx.action = 'indices/tops';
  ctx.type   = 'json';
  ctx.index  = index;
  const username = ctx.state.user.username;

  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate  = now.getDate();

  let size = parseInt(ctx.query.size);

  if (isNaN(size)) {
    size = 10;
  } else {
    size = Math.min(Math.abs(size), 50);
  }

  const dateRange = {
    min: new Date(0),
    max: now
  };

  switch (ctx.query.period) {
    case 'today':
      dateRange.min = new Date(currentYear, currentMonth, currentDate);
      break;
    case 'yersteday':
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
      this.throw(400, 'Invalid period');
      break;
  }

  const result = await elasticsearch.search({
    index,
    type: "event",
    headers: { 'es-security-runas-user': username },
    body: {
      size: 0,
      query: {
        bool: {
          must: [{
            range: {
              datetime: {
                gte: dateRange.min.getTime(),
                lte: dateRange.max.getTime(),
                format: "epoch_millis"
              }
            }
          }]
        }
      },
      aggs : {
        indices   : { terms: { field: "_index", size } },
        titles    : { terms: { field: "publication_title", size } },
        publishers: { terms: { field: "publisher_name", size } },
        maxDate   : { max : { field: "datetime" } },
        minDate   : { min : { field: "datetime" } }
      }
    }
  });

  const {
    took,
    hits = {},
    aggregations = {}
  } = result;

  const {
    titles = {},
    publishers = {},
    indices = {},
    minDate = {},
    maxDate = {}
  } = aggregations;

  ctx.body = {
    took,
    docs: hits.total,
    dateCoverage: {
      min: minDate.value,
      max: maxDate.value
    },
    tops: {
      titles: titles.buckets,
      publishers: publishers.buckets,
      indices: indices.buckets
    }
  };
}
