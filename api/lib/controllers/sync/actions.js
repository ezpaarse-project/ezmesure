const {
  startSync,
  isSynchronizing,
  getStatus,
} = require('../../services/sync');
const { appLogger } = require('../../services/logger');

exports.startSync = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 202;

  if (!isSynchronizing()) {
    startSync().catch((err) => {
      appLogger.error(`[sync] Synchronization failed: ${err}`);
    });
  }

  ctx.body = getStatus();
};

exports.getSyncStatus = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = getStatus();
};
