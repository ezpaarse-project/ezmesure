const config = require('config');
const CronJob = require('cron').CronJob;
const sendMail = require('./mail');
const elastic = require('./elastic');
const { sender, recipients, cron } = config.get('notifications');

module.exports = {
  start (appLogger) {
    const job = new CronJob(cron, () => {
      sendNotifications().then(() => {
        appLogger.info('Recent activity successfully broadcasted');
      }).catch(err => {
        appLogger.error(`Failed to broadcast recent activity : ${err}`);
      });
    });

    if (recipients) {
      job.start();
    } else {
      appLogger.warn('No recipient configured, notifications will be disabled');
    }
  }
}

/**
 * Send a mail containing new files and users
 */
async function sendNotifications () {
  const result = await elastic.search({
    index: '.ezmesure-metrics',
    size: 1000,
    body: {
      'query': {
        'bool': {
          'must_not': [
            { 'exists': { 'field': 'metadata.broadcasted' } }
          ],
          'filter': [
            { 'exists': { 'field': 'metadata' } },
            { 'terms': { 'action': ['file/upload', 'user/register'] } },
            { 'range': { 'response.status': { 'gte': 200, 'lt': 400 } } }
          ]
        }
      }
    }
  });

  const actions = result && result.hits && result.hits.hits;

  if (actions.length === 0) {
    return;
  }

  const files = uniq(actions
    .filter(a => a._source.action === 'file/upload')
    .map(a => a._source.metadata.path)
  );
  const users = uniq(actions
    .filter(a => a._source.action === 'user/register')
    .map(a => a._source.metadata.username)
  );

  const fileItems = files.sort().map(file => `<li>${file}</li>`);
  const userItems = await Promise.all(
    users.sort().map(username => {
      return elastic.findUser(username).then(user => user ? `<li>${user.full_name} (${user.email})</li>` : '');
    }
  ));

  let text = '';
  let html = '';

  if (users.length > 0) {
    text += `
      Nouveaux utilisateurs enregistrés :
      ${users.join('\n')}
    `;

    html += `
      <p>Nouveaux utilisateurs enregistrés :</p>
      <ul>
        ${userItems.join('\n')}
      </ul>
    `;
  }

  if (files.length > 0) {
    text += `
      Nouveaux fichiers déposés :
      ${files.join('\n')}
    `;

    html += `
      <p>Nouveaux fichiers déposés :</p>
      <ul>
        ${fileItems.join('\n')}
      </ul>
    `;
  }

  await sendMail({
    from: sender,
    to: recipients,
    subject: '[Admin] Activité ezMESURE',
    text,
    html
  });

  return setBroadcasted(actions);
}

/**
 * Helper function that removes duplicates from an array
 * @param {Array} array an array of arbitrary things
 */
function uniq (array) {
  return Array.from(new Set(array));
}

/**
 * Set metadata.broacasted to the current date for a list of action documents
 * @param {Array<Object>} actions a set of action documents from the metrics index
 */
function setBroadcasted (actions) {
  const bulk = [];
  const now = new Date();

  actions.forEach(action => {
    bulk.push({ update: { _id: action._id, _type: action._type, _index: action._index } });
    bulk.push({ doc: { metadata: { broadcasted: now } } });
  });

  return elastic.bulk({ body: bulk });
}
