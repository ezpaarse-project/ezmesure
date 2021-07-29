/* eslint-disable no-underscore-dangle */
const config = require('config');
const { fr } = require('date-fns/locale');
const { format, isValid } = require('date-fns');
const { CronJob } = require('cron');
const { sendMail, generateMail } = require('./mail');
const elastic = require('./elastic');

const { sender, recipients, cron } = config.get('notifications');

/**
 * Change a timestamp into a locale date
 */
function toLocaleDate(timestamp) {
  const date = new Date(timestamp);
  return isValid(date) ? format(date, 'Pp', { locale: fr }) : 'Invalid date';
}

async function getEzMesureMetrics() {
  const { body: result } = await elastic.search({
    index: '.ezmesure-metrics',
    size: 10000,
    sort: 'datetime:desc',
    body: {
      query: {
        bool: {
          must_not: [
            { exists: { field: 'metadata.broadcasted' } },
          ],
          filter: [
            {
              range: {
                datetime: { gte: 'now-1w' },
              },
            },
            {
              terms: {
                action: [
                  'file/upload',
                  'file/delete',
                  'file/delete-many',
                  'user/register',
                  'indices/insert',
                  'institutions/create',
                  'institutions/update',
                  'institutions/delete',
                ],
              },
            },
          ],
        },
      },
    },
  });

  const actions = result && result.hits && result.hits.hits;

  if (actions.length === 0) {
    return {};
  }

  const files = actions
    .filter((a) => a._source.action.startsWith('file/'))
    .map(({ _source }) => {
      const metadata = _source.metadata || {};
      const paths = metadata.path || [];
      return {
        ..._source,
        path: Array.isArray(paths) ? paths : [paths],
        datetime: toLocaleDate(_source.datetime),
      };
    });

  const users = await Promise.all(actions
    .filter((a) => a._source.action === 'user/register')
    .map(async ({ _source }) => {
      const { username } = _source.metadata || {};
      const elasticUser = username && await elastic.security.findUser({ username });
      return {
        ..._source,
        elasticUser,
        datetime: toLocaleDate(_source.datetime),
      };
    }));

  const insertions = actions
    .filter((a) => a._source.action === 'indices/insert')
    .map(({ _source }) => ({
      ..._source,
      datetime: toLocaleDate(_source.datetime),
    }));

  const institutions = actions
    .filter((a) => a._source.action.startsWith('institutions/'))
    .map(({ _source }) => ({
      ..._source,
      datetime: toLocaleDate(_source.datetime),
    }));

  return {
    actions,
    files,
    users,
    insertions,
    institutions,
  };
}

async function getReportingActivity() {
  const index = config.reportingActivityIndex || '.ezreporting-activity';
  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    return {};
  }

  const { body: result } = await elastic.search({
    index,
    size: 10000,
    sort: 'datetime:desc',
    body: {
      query: {
        bool: {
          must_not: [
            { exists: { field: 'metadata.broadcasted' } },
          ],
          filter: [
            {
              range: {
                datetime: { gte: 'now-1w' },
              },
            },
            {
              terms: {
                action: [
                  'reporting/store',
                  'reporting/update',
                  'reporting/delete',
                ],
              },
            },
          ],
        },
      },
    },
  });

  const actions = result && result.hits && result.hits.hits;

  if (actions.length === 0) {
    return {};
  }

  const reportings = actions.map(({ _source }) => ({
    ..._source,
    datetime: toLocaleDate(_source.datetime),
  }));

  return { actions, reportings };
}

/**
 * Set metadata.broacasted to the current date for a list of action documents
 * @param {Array<Object>} actions a set of action documents from the metrics index
 */
function setBroadcasted(actions) {
  const bulk = [];
  const now = new Date();

  actions.forEach((action) => {
    bulk.push({ update: { _id: action._id, _type: action._type, _index: action._index } });
    bulk.push({ doc: { metadata: { broadcasted: now } } });
  });

  return elastic.bulk({ body: bulk });
}

/**
 * Send a mail containing new files and users
 */
async function sendNotifications() {
  const {
    actions: ezMesureActions = [],
    files,
    users,
    insertions,
    institutions,
  } = await getEzMesureMetrics();
  const { actions: reportingActions = [], reportings } = await getReportingActivity();

  const actions = [...ezMesureActions, ...reportingActions];

  if (actions.length === 0) {
    return;
  }

  await sendMail({
    from: sender,
    to: recipients,
    subject: '[Admin] Activité ezMESURE',
    ...generateMail('recent-activity', {
      files,
      users,
      insertions,
      reportings,
      institutions,
    }),
  });

  // eslint-disable-next-line consistent-return
  return setBroadcasted(actions);
}

module.exports = {
  start(appLogger) {
    const job = new CronJob(cron, () => {
      sendNotifications().then(() => {
        appLogger.info('Recent activity successfully broadcasted');
      }).catch((err) => {
        appLogger.error(`Failed to broadcast recent activity : ${err}`);
      });
    });

    if (recipients) {
      job.start();
    } else {
      appLogger.warn('No recipient configured, notifications will be disabled');
    }
  },
};
