const get = require('lodash.get');

const elastic = require('../../services/elastic');
const logger = require('../../logger');

async function getDashboards(space) {
  const bool = {
    must: [{
      match: {
        type: 'dashboard',
      },
    }],
  };

  if (space) {
    if (space !== 'default') {
      bool.must.push({
        match: {
          namespace: space,
        },
      });
    } else {
      bool.must_not = {
        exists: {
          field: 'namespace',
        },
      };
    }
  }

  let dashboardsList;
  try {
    const { body: data } = await elastic.search({
      index: '.kibana',
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool,
        },
      },
    });
    dashboardsList = get(data, 'hits.hits') || []
  } catch (err) {
    logger.error(err);
  }

  const dashboards = [];
  for (let i = 0; i < dashboardsList.length; i += 1) {
    const id = get(dashboardsList[i], '_id').split(':').pop();
    const { dashboard, namespace } = get(dashboardsList[i], '_source');

    dashboards.push({
      id,
      name: dashboard.title,
      description: dashboard.description,
      namespace: namespace || 'default',
    });
  }
  return dashboards;
}

exports.getAll = async (ctx) => {
  logger.info('reporting/getDashboards');
  ctx.action = 'reporting/getDashboards';
  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = await getDashboards();
};

exports.getBySpace = async (ctx) => {
  logger.info('reporting/getDashboards');
  ctx.action = 'reporting/getDashboards';
  ctx.type = 'json';
  ctx.status = 200;

  const { space } = ctx.request.params;

  ctx.body = await getDashboards(space);
};
