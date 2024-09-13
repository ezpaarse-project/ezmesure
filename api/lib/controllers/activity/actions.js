const elastic = require('../../services/elastic');

const activityIndex = '.ezmesure-metrics';

exports.search = async (ctx) => {
  const {
    size = 10,
    page = 1,
    sort: sortBy = 'datetime',
    order: sortOrder = 'desc',
    date,
    type,
    username,
  } = ctx.query;

  const from = (page - 1) * size;
  const filter = [];

  if (type) {
    filter.push({
      terms: {
        action: Array.isArray(type) ? type : type.split(',').map((t) => t.trim()),
      },
    });
  }
  if (username) {
    filter.push({
      terms: {
        'user.name': Array.isArray(username) ? username : username.split(',').map((t) => t.trim()),
      },
    });
  }

  if (date) {
    filter.push({
      range: {
        datetime: {
          format: 'date_optional_time',
          gte: date,
          lte: date,
        },
      },
    });
  }

  const { body = {} } = await elastic.search({
    index: activityIndex,
    size: size || undefined,
    from,
    body: {
      sort: [{ [sortBy]: { order: sortOrder } }],
      query: filter.length ? { bool: { filter } } : { match_all: {} },
    },
  });

  const metrics = body?.hits?.hits;

  if (!Array.isArray(metrics)) {
    ctx.throw(500, ctx.$t('errors.activity.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = {
    total: body?.hits?.total,
    items: metrics
      .filter((m) => m?._source) // eslint-disable-line no-underscore-dangle
      .map((m) => ({ id: m?._id, ...m?._source })), // eslint-disable-line no-underscore-dangle
  };
};

exports.getOne = async (ctx) => {
  const { metricId } = ctx.params;

  const { body: metric, statusCode } = await elastic.get({
    index: activityIndex,
    id: metricId,
  }, {
    ignore: [404],
  });

  if (statusCode === 404) {
    ctx.throw(404, ctx.$t('errors.metric.notFound', metricId));
  }

  ctx.status = 200;
  ctx.body = { id: metric._id, ...metric._source }; // eslint-disable-line no-underscore-dangle
};
