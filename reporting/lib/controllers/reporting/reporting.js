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
const histo = require('../../views/bibCNRS/bibcnrs-report-02-histo-instituts-results.json');
const diag1bibCNRS = require('../../views/bibCNRS/bibcnrs-report-01-metrics-results.json');
const diag3bibCNRS = require('../../views/bibCNRS/bibcnrs-report-03-table-instituts-results.json');
const diag4bibCNRS = require('../../views/bibCNRS/bibcnrs-report-04-table-top-10-labo-results.json');
const diag5bibCNRS = require('../../views/bibCNRS/bibcnrs-report-05-pie-rtype-results.json');
const diag6bibCNRS = require('../../views/bibCNRS/bibcnrs-report-06-table-top-10-rtype-results.json');
const diag7bibCNRS = require('../../views/bibCNRS/bibcnrs-report-07-table-top-20-plateform-results.json');
const diag8bibCNRS = require('../../views/bibCNRS/bibcnrs-report-08-pie-doi-results.json');
const diag9bibCNRS = require('../../views/bibCNRS/bibcnrs-report-09-table-top-10-articles-results.json');

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

function histogramme(data) {
  const values = [];

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
}

const parameters = {
  diag1bibCNRS: {
    data: [{ key: 'consultations', value: diag1bibCNRS.hits.total },
      { key: 'units', value: diag1bibCNRS.aggregations[4].value },
      { key: 'platforms', value: diag1bibCNRS.aggregations[6].value }],
  },
  diag3bibCNRS: {
    data: diag3bibCNRS.aggregations[2].buckets.map((elt) => [elt.key, elt.doc_count]),
    columns: ['Name', 'Consultations'],
  },
  diag4bibCNRS: {
    data: diag4bibCNRS.aggregations[2].buckets.map((elt) => [elt.key, elt.doc_count]),
    columns: ['Name', 'Consultations'],
  },
  diag5bibCNRS: {
    description: 'A simple pie chart with embedded data.',
    height: 200,
    width: 220,
    theta: 'count',
    color: 'key',
    data: {
      values: diag5bibCNRS.aggregations[2].buckets.map((elt) => ({
        key: elt.key,
        count: elt.doc_count,
      })),
    },
  },
  diag6bibCNRS: {
    data: diag6bibCNRS.aggregations[2].buckets.map((elt) => [elt.key, elt.doc_count]),
    columns: ['Name', 'Consultations'],
  },
  diag7bibCNRS: {
    data: diag7bibCNRS.aggregations[2].buckets.map((elt) => [elt.key, elt.doc_count]),
    columns: ['Name', 'Consultations'],
  },
  diag8bibCNRS: {
    description: 'A simple pie chart with embedded data.',
    height: 200,
    width: 220,
    theta: 'count',
    color: 'key',
    data: {
      values: [{ key: 'with_DOI', count: diag8bibCNRS.aggregations[2].buckets['with DOI'].doc_count },
        { key: 'without_DOI', count: diag8bibCNRS.aggregations[2].buckets['without DOI'].doc_count },
      ],
    },
  },
  diag9bibCNRS: {
    data: diag9bibCNRS.aggregations[2].buckets.map((elt) => [
      elt.key, elt[3].buckets[0].key, elt.doc_count,
    ]),
    columns: ['Type', 'Name', 'Consultations'],
  },
  barChart: {
    description: 'A simple bar chart with embedded data.',
    height: 200,
    width: 400,
    data: {
      values: [
        { a: 'A', b: 28 }, { a: 'B', b: 55 }, { a: 'C', b: 43 },
        { a: 'D', b: 91 }, { a: 'E', b: 81 }, { a: 'F', b: 53 },
        { a: 'G', b: 19 }, { a: 'H', b: 87 },
      ],
    },
  },
  donut: {
    description: 'A basic pie chart example.',
    height: 200,
    width: 220,
    data: {
      values: [
        { category: 1, value: 4 },
        { category: 2, value: 6 },
        { category: 3, value: 10 },
        { category: 4, value: 3 },
        { category: 5, value: 7 },
        { category: 6, value: 8 },
      ],
    },
  },
  stackedBarChart: {
    description: 'A basic stacked bar chart example.',
    height: 400,
    width: 1000,
    data: {
      values: histogramme(histo),
    },
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
