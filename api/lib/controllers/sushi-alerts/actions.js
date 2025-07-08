const { addMinutes, isBefore } = require('date-fns');

const HarvestService = require('../../entities/harvest.service');
const { appLogger } = require('../../services/logger');

const cache = {
  harvestedButUnsupported: {
    value: undefined,
    updatedAt: undefined,
  },
};

/**
 * @typedef {object} Alert
 * @property {string} type
 * @property {'info'|'warn'|'error'} severity
 * @property {object} data
 */

async function listHarvestedButUnsupported() {
  const cacheExpires = addMinutes(cache.harvestedButUnsupported.updatedAt ?? 0, 15);
  if (isBefore(new Date(), cacheExpires)) {
    return cache.harvestedButUnsupported.value ?? [];
  }

  appLogger.info('[sushi-alerts] Calculating harvestedButUnsupported alerts');

  /** @type {Map<string, Alert>} */
  const alertsMap = new Map();

  // Severity by harvest status
  const SEVERITY_PER_STATUS = new Map([
    ['finished', 'info'],
    ['missing', 'warning'],
    // will defaults to "error"
  ]);

  const harvestService = new HarvestService();

  const scroller = harvestService.scroll({
    where: {
      status: {
        notIn: ['running', 'waiting', 'delayed'],
      },
      credentials: {
        deletedAt: null,
      },
    },
    select: {
      reportId: true,
      credentialsId: true,
      status: true,
      period: true,

      credentials: {
        include: {
          endpoint: true,
          institution: true,
        },
      },
    },
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const harvest of scroller) {
    // Filter harvests with a reportId marked as "unsupported" in the endpoint
    // or endpoints without supportedData
    const { supportedData } = harvest.credentials.endpoint;
    if (supportedData?.[harvest.reportId]?.supported?.value !== false) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const key = `${harvest.credentialsId}:${harvest.reportId}:${harvest.status}`;
    const alert = alertsMap.get(key) ?? {
      type: 'harvestedButUnsupported',
      severity: SEVERITY_PER_STATUS.get(harvest.status) ?? 'error',
      data: {
        reportId: harvest.reportId,
        status: harvest.status,
        credentialsId: harvest.credentialsId,

        beginDate: harvest.period,
        endDate: harvest.period,

        credentials: harvest.credentials,
      },
    };

    // TODO: what if missing one ?
    if (alert.data.beginDate >= harvest.period) {
      alert.data.beginDate = harvest.period;
    }
    if (alert.data.endDate <= harvest.period) {
      alert.data.endDate = harvest.period;
    }

    alertsMap.set(key, alert);
  }

  const data = Array.from(alertsMap.values());
  cache.harvestedButUnsupported.value = data;
  cache.harvestedButUnsupported.updatedAt = new Date();

  appLogger.info('[sushi-alerts] Caching harvestedButUnsupported alerts');

  return data;
}

exports.list = async (ctx) => {
  const {
    type,
  } = ctx.query;

  const alerts = [];
  if (!type || type === 'harvestedButUnsupported') {
    alerts.push(...await listHarvestedButUnsupported());
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = alerts;
};
