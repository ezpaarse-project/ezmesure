/* eslint-disable no-underscore-dangle */
const config = require('config');
const { fr } = require('date-fns/locale');
const { format, isValid } = require('date-fns');
const { sendMail, generateMail } = require('./mail');
const elastic = require('./elastic');
const { appLogger } = require('./logger');

const {
  sender,
  recipients,
  sendEmptyActivity,
} = config.get('notifications');

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
                  'sushi/create',
                  'sushi/update',
                  'sushi/delete-many',
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

  const sushi = actions
    .filter((a) => a._source.action.startsWith('sushi/'))
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
    sushi,
  };
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
async function sendNotifications(logger = appLogger) {
  const {
    actions = [],
    files,
    users,
    insertions,
    institutions,
    sushi,
  } = await getEzMesureMetrics();

  if (actions.length === 0 && !sendEmptyActivity) {
    logger.info('No recent activity to be broadcasted');
    return;
  }

  await sendMail({
    from: sender,
    to: recipients,
    subject: '[Admin] Activité ezMESURE',
    ...generateMail('recent-activity', {
      noActions: actions.length === 0,
      files,
      users,
      insertions,
      institutions,
      sushi,
    }),
  });

  logger.info('Recent activity successfully broadcasted');

  if (actions.length > 0) {
    try {
      await setBroadcasted(actions);
    } catch (err) {
      logger.error(`Failed to mark actions as broadcasted : ${err}`);
    }
  }
}

module.exports = {
  sendNotifications,
};
