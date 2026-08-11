const { getMetrics } = require('../../services/metrics');

/**
 * Return global aggregated metrics
 */
exports.overall = async (ctx) => {
  const metrics = await getMetrics();
  if (metrics.error) {
    ctx.status = 500;
  }

  ctx.type = 'json';
  ctx.body = metrics;
};
