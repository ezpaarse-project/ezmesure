const config = require('config');
const CronJob = require('cron').CronJob;
const sendMail = require('./mail');
const { appLogger } = require('../../server');
const { sender, recipients, cron } = config.get('notifications');

let newFiles = [];
let newUsers = [];

const job = new CronJob(cron, () => {
  sendNotifications().catch(err => {
    appLogger.error('Failed to send mail', err);
  });
});

if (recipients) {
  job.start();
} else {
  appLogger.warn('No recipient configured, notifications will be disabled');
}

/**
 * Send a mail containing new files and users
 */
function sendNotifications () {
  if (newFiles.length === 0 && newUsers.length === 0) {
    return Promise.resolve();
  }

  const files = newFiles.slice().sort();
  const users = newUsers.slice();
  const fileItems = files.map(f => `<li>${f}</li>`);
  const userItems = users.map(u => `<li>${u.full_name} (${u.email})</li>`);
  newFiles = [];
  newUsers = [];

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

  return sendMail({
    from: sender,
    to: recipients,
    subject: '[Admin] Activité ezMESURE',
    text,
    html
  });
}

module.exports = {
  newFile (file) {
    if (recipients && file) { newFiles.push(file); }
  },
  newUser (user) {
    if (recipients && user) { newUsers.push(user); }
  }
}