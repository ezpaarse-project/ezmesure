const ezreeportSync = require('./sync/ezreeport');
const harvest = require('./harvest');
const harvestJob = require('./harvest-job');
const metrics = require('./metrics');
const notifications = require('./notifications');
const opendata = require('./opendata');
const outgoingEmails = require('./outgoing-emails');
const sushi = require('./sushi');
const sushiAlerts = require('./sushi-alerts');
const sushiCredentials = require('./sushi-credentials');
const testUsers = require('./test-users');
const users = require('./users');

module.exports = {
  startAll: () => {
    notifications.startBroadcastCron();

    opendata.startRefreshCron();

    ezreeportSync.startSyncCron();

    sushi.startCleanCron();
    sushiCredentials.startDeletionCron();
    sushiAlerts.startFetchCron();

    harvest.startCancelCron();
    harvestJob.startJobDeletion();

    metrics.start();

    users.startDeletionCron();
    testUsers.startExpiredCron();

    outgoingEmails.startEmailsSummaryCron();
    outgoingEmails.startEmailsCleanupCron();
  },
};
