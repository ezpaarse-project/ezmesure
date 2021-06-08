const {
  index,
  historyIndex,
  frequencies,
  reportingName,
} = require('config');
const logger = require('../../logger');
const elastic = require('../../services/elastic');
const { generateReport } = require('../../services/reporting');
const Frequency = require('../../services/frequency');
const bibCNRSdiag1 = require('../../views/bibCNRS/bibcnrs-report-01-metrics-results.json');
const bibCNRSdiag2 = require('../../views/bibCNRS/bibcnrs-report-02-histo-instituts-results.json');
const bibCNRSdiag3 = require('../../views/bibCNRS/bibcnrs-report-03-table-instituts-results.json');
const bibCNRSdiag4 = require('../../views/bibCNRS/bibcnrs-report-04-table-top-10-labo-results.json');
const bibCNRSdiag5 = require('../../views/bibCNRS/bibcnrs-report-05-pie-rtype-results.json');
const bibCNRSdiag6 = require('../../views/bibCNRS/bibcnrs-report-06-table-top-10-rtype-results.json');
const bibCNRSdiag7 = require('../../views/bibCNRS/bibcnrs-report-07-table-top-20-plateform-results.json');
const bibCNRSdiag8 = require('../../views/bibCNRS/bibcnrs-report-08-pie-doi-results.json');
const bibCNRSdiag9 = require('../../views/bibCNRS/bibcnrs-report-09-table-top-10-articles-results.json');

async function getMetadata(taskId) {
  const { body: data } = await elastic.getSource({
    index,
    id: taskId,
  });

  if (data) {
    const { body: dashboard } = await elastic.getSource({
      index: '.kibana',
      // eslint-disable-next-line no-underscore-dangle
      id: `${data.space ? `${data.space}:` : ''}dashboard:${data.dashboardId}`,
    });

    if (dashboard && dashboard.type === 'dashboard') {
      return {
        dashboardName: dashboard.dashboard.title,
        space: data.space || null,
      };
    }

    return null;
  }
  return null;
}

async function getDashboards(namespace) {
  const bool = {
    must: [{
      match: {
        type: 'dashboard',
      },
    }],
  };

  if (namespace) {
    bool.must.push({
      match: {
        namespace,
      },
    });
  } else {
    bool.must_not = {
      exists: {
        field: 'namespace',
      },
    };
  }

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

    if (data && data.hits && data.hits.hits) {
      return data.hits.hits;
    }
  } catch (err) {
    logger.error(err);
    return [];
  }

  return [];
}

exports.list = async (ctx) => {
  logger.info('reporting/list');
  ctx.action = 'reporting/list';
  ctx.type = 'json';
  ctx.status = 200;

  const { space } = ctx.request.params;

  ctx.space = space;

  let dashboardsData;
  try {
    dashboardsData = await getDashboards(space);
  } catch (err) {
    ctx.body = { tasks: [], dashboards: [], frequencies };
    logger.error(err);
    ctx.status = 500;
    return;
  }

  const dashboards = dashboardsData.map(({ _id: dashId, _source: dashSource }) => {
    const dashboardId = dashId.split(':').pop();
    const dashboardTitle = dashSource && dashSource.dashboard && dashSource.dashboard.title;

    return {
      id: dashboardId,
      name: dashboardTitle,
    };
  });

  const bool = {
    must: [],
  };

  if (space) {
    bool.must.push({
      match: {
        space,
      },
    });
  }

  if (!space) {
    bool.must_not = {
      exists: {
        field: 'space',
      },
    };
  }

  let tasksData;
  try {
    tasksData = await elastic.search({
      index,
      timeout: '30s',
      body: {
        size: 10000,
        query: {
          bool,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  const body = tasksData && tasksData.body;
  const hits = (body && body.hits && body.hits.hits) || [];

  const tasks = hits.map((hit) => {
    const { _source: hitSource, _id: hitId } = hit;
    const dashboard = dashboards.find(({ id }) => id === hitSource.dashboardId);

    return {
      _id: hitId,
      dashboardId: hitSource.dashboardId,
      exists: !!dashboard,
      reporting: {
        frequency: hitSource.frequency,
        emails: hitSource.emails,
        print: hitSource.print,
        createdAt: hitSource.createdAt,
        sentAt: hitSource.sentAt,
        runAt: hitSource.runAt,
      },
    };
  });

  ctx.body = {
    tasks,
    dashboards,
    frequencies,
    reportingName,
  };
};

exports.store = async (ctx) => {
  logger.info('reporting/store');
  ctx.action = 'reporting/store';

  const { body } = ctx.request;
  const frequency = new Frequency(body.frequency);

  if (!frequency.isValid()) {
    ctx.throw(400, 'invalid frequency');
    return;
  }

  const now = new Date();
  body.createdAt = now;
  body.updatedAt = now;
  body.sentAt = null;
  body.runAt = frequency.startOfnextPeriod(now);

  try {
    const { body: data } = await elastic.index({ index, body });
    const { _id: dataId } = data;

    ctx.taskId = dataId;

    ctx.metadata = await getMetadata(dataId);

    ctx.body = {
      _id: dataId,
      createdAt: body.createdAt,
      sentAt: body.sentAt,
      runAt: body.runAt,
    };
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  ctx.status = 200;
};

exports.update = async (ctx) => {
  logger.info('reporting/update');
  ctx.action = 'reporting/update';

  const now = new Date();
  const { body } = ctx.request;
  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;
  const frequency = new Frequency(body.frequency);

  if (!frequency.isValid()) {
    ctx.throw(400, 'invalid frequency');
    return;
  }

  try {
    await elastic.update({
      index,
      id,
      body: {
        doc: {
          ...body,
          runAt: frequency.startOfnextPeriod(now),
          updatedAt: now,
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  try {
    ctx.metadata = await getMetadata(id);
  } catch (e) {
    logger.error(e);
  }

  ctx.status = 204;
};

exports.del = async (ctx) => {
  logger.info('reporting/delete');
  ctx.action = 'reporting/delete';
  ctx.status = 204;

  if (ctx.invalid) {
    const errors = [];

    const { params } = ctx.invalid;
    if (params) {
      params.details.forEach(({ message }) => errors.push(message));
    }

    ctx.status = 400;
    ctx.body = errors;
    return;
  }

  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;

  try {
    ctx.metadata = await getMetadata(id);
  } catch (e) {
    logger.error(e);
  }

  try {
    await elastic.delete({
      id,
      index,
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }

  try {
    await elastic.deleteByQuery({
      index: historyIndex,
      body: {
        query: {
          match: {
            taskId: id,
          },
        },
      },
    });
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.history = async (ctx) => {
  logger.info('reporting/history');
  ctx.action = 'reporting/history';

  const { taskId: id } = ctx.request.params;
  ctx.taskId = id;

  if (!id) {
    ctx.status = 404;
    return;
  }

  try {
    const { body: data } = await elastic.search({
      index: historyIndex,
      timeout: '30s',
      body: {
        size: 10000,
        sort: {
          startTime: {
            order: 'desc',
          },
        },
        query: {
          bool: {
            must: [
              {
                match: {
                  taskId: id,
                },
              },
            ],
          },
        },
      },
    });

    const hits = data && data.hits && data.hits.hits;

    if (hits) {
      ctx.type = 'json';
      ctx.status = 200;

      ctx.body = hits.map((historyItem) => {
        const { _source: historySource, _id: historyId } = historyItem;

        return {
          id: historyId,
          ...historySource,
        };
      });
    }
  } catch (err) {
    logger.error(err);
    ctx.status = 500;
  }
};

exports.download = async (ctx) => {
  const { taskId } = ctx.request.params;
  ctx.taskId = taskId;

  let task;
  try {
    const { body } = await elastic.get({ id: taskId, index });
    task = body;
  } catch (e) {
    logger.error(`Cannot find task ${taskId}`);
  }

  if (!task) {
    ctx.status = 404;
    ctx.body = {
      statusCode: 404,
      error: `Cannot find task ${taskId}`,
    };
    return;
  }

  const { _source: source } = task;
  const frequencyData = frequencies.find((freq) => freq.value === source.frequency);

  if (!frequencyData) {
    ctx.status = 500;
    ctx.body = {
      statusCode: 500,
      error: `no frequency data found for task ${taskId}`,
    };
    return;
  }

  try {
    generateReport(task);
    ctx.status = 200;
  } catch (err) {
    logger.err(err);
    ctx.status(500);
  }
};

function elastic2vega(etablissement, diagram, data) {
  const values = [];
  if (etablissement === 'bibCNRS') {
    if (diagram === 'histogramme') {
      data.aggregations['2'].buckets.forEach((bucket) => {
        bucket['3'].buckets.forEach((el) => {
          values.push({
            date: bucket.key_as_string,
            key: el.key,
            count: el.doc_count,
          });
        });
      });
      return values;
    } if (diagram === 'pie') {
      const total = data.aggregations[2].buckets.reduce((accum, item) => accum + item.doc_count, 0);

      return data.aggregations[2].buckets.map((elt) => ({
        key: elt.key,
        percent: `${((elt.doc_count / total) * 100).toFixed(2) > 2 ? `${((elt.doc_count / total) * 100).toFixed(2)}%` : ''}`,
        count: elt.doc_count,
      }));
    } if (diagram === 'table2columns') {
      return data.aggregations[2].buckets.map((elt) => [elt.key, elt.doc_count]);
    } if (diagram === 'table3columns') {
      return data.aggregations[2].buckets.map((elt) => [
        elt.key, elt[3].buckets[0].key, elt.doc_count,
      ]);
    } if (diagram === 'doi') {
      return [{
        key: 'with_DOI',
        percent: `${((data.aggregations[2].buckets['with DOI'].doc_count / data.hits.total) * 100).toFixed(2)}%`,
        count: data.aggregations[2].buckets['with DOI'].doc_count,
      },
      {
        key: 'without_DOI',
        percent: `${((data.aggregations[2].buckets['without DOI'].doc_count / data.hits.total) * 100).toFixed(2)}%`,
        count: data.aggregations[2].buckets['without DOI'].doc_count,
      },
      ];
    } if (diagram === 'metrics') {
      return [{ key: 'consultations', value: data.hits.total },
        { key: 'units', value: data.aggregations[4].value },
        { key: 'platforms', value: data.aggregations[6].value }];
    }
  }
  return values;
}

const parameters = {
  bibCNRSdiag1: {
    data: elastic2vega('bibCNRS', 'metrics', bibCNRSdiag1),
  },
  bibCNRSdiag2: {
    id: 's-bar-chart-1',
    title: 'Histo-instituts',
    description: 'A basic stacked bar chart example.',
    x: {
      timeUnit: 'monthdate', field: 'date', type: 'ordinal', axis: { title: '' },
    },
    y: {
      field: 'count', type: 'quantitative', axis: { title: '' },
    },
    color: { field: 'key' },
    data: {
      values: elastic2vega('bibCNRS', 'histogramme', bibCNRSdiag2),
    },
  },
  bibCNRSdiag3: {
    title: 'Table-instituts',
    data: elastic2vega('bibCNRS', 'table2columns', bibCNRSdiag3),
    columns: ['Institute name', 'Number of consultations'],
  },
  bibCNRSdiag4: {
    title: 'Table-top-10-labo',
    data: elastic2vega('bibCNRS', 'table2columns', bibCNRSdiag4),
    columns: ['Laboratory name', 'Number of consultations'],
  },
  bibCNRSdiag5: {
    id: 'donut-1',
    title: 'Row types',
    description: 'A simple pie chart with embedded data.',
    theta: { field: 'count', type: 'quantitative', stack: true },
    color: { field: 'key', type: 'nominal', legend: { direction: 'vertical', orient: 'right', title: 'row types' } },
    data: {
      values: elastic2vega('bibCNRS', 'pie', bibCNRSdiag5),
    },
  },
  bibCNRSdiag6: {
    title: 'Table-top-10-rtype',
    data: elastic2vega('bibCNRS', 'table2columns', bibCNRSdiag6),
    columns: ['Type', 'Number of consultations'],
  },
  bibCNRSdiag7: {
    title: 'Table-top-20-plateform',
    data: elastic2vega('bibCNRS', 'table2columns', bibCNRSdiag7),
    columns: ['Platform name', 'Number of consultations'],
  },
  bibCNRSdiag8: {
    id: 'donut-2',
    title: 'DOI',
    description: 'A simple pie chart with embedded data.',
    theta: { field: 'count', type: 'quantitative', stack: true },
    color: { field: 'key', type: 'nominal', legend: { direction: 'vertical', orient: 'right', title: 'row types' } },
    data: {
      values: elastic2vega('bibCNRS', 'doi', bibCNRSdiag8),
    },
  },
  bibCNRSdiag9: {
    title: 'Table-top-10-articles',
    data: elastic2vega('bibCNRS', 'table3columns', bibCNRSdiag9),
    columns: ['Article name', 'Institution', 'Number of consultations'],
  },
};

exports.renderNotOptimized = async (ctx) => {
  await ctx.render('not-optimized', {
    etablissement: 'bibCNRS - NON OPTIMISÉ',
    parameters,
  });
};

exports.renderOptimized = async (ctx) => {
  await ctx.render('optimized', { etablissement: 'bibCNRS - OPTIMISÉ' });
};

exports.renderBibCNRS = async (ctx) => {
  await ctx.render('bibCNRS', { etablissement: 'BibCNRS', parameters });
};
