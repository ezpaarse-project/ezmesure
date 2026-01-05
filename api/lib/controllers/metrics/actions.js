const { getMetrics } = require('../../services/metrics');

/**
 * Return global aggregated metrics
 */
exports.overall = async (ctx) => {
  ctx.type = 'json';
  ctx.body = await getMetrics();
};
