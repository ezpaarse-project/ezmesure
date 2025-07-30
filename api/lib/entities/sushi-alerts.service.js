// @ts-check
const { formatISO } = require('date-fns');
const BasePrismaService = require('./base-prisma.service');
const alertsPrisma = require('../services/prisma/sushi-alerts');

const { getStatus } = require('../services/sushi');
const { appLogger } = require('../services/logger');

const HarvestService = require('./harvest.service');
const EndpointsService = require('./sushi-endpoints.service');

const { isObject, isFalse } = require('../utils/type-guards');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').SushiAlert} SushiAlert
 * @typedef {import('@prisma/client').Prisma.SushiAlertUpdateArgs} SushiAlertUpdateArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertUpsertArgs} SushiAlertUpsertArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertFindUniqueArgs} SushiAlertFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertFindManyArgs} SushiAlertFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertCreateArgs} SushiAlertCreateArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertCreateInput} SushiAlertCreateInput
 * @typedef {import('@prisma/client').Prisma.SushiAlertDeleteArgs} SushiAlertDeleteArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertDeleteManyArgs} SushiAlertDeleteManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiAlertCountArgs} SushiAlertCountArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointGetPayload<{ include: { credentials: true } }>} SushiEndpointWithCredentials
 * @typedef {import('@prisma/client').Prisma.HarvestGetPayload<{ include: { credentials: { include: { endpoint: true, institution: true } } } }>} HarvestWithInstitutionAndEndpoint
 * @typedef {import('@prisma/client').Prisma.PrismaPromise<unknown>} PrismaPromise
 */
/* eslint-enable max-len */

module.exports = class SushiAlertsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SushiAlertsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SushiAlertCreateArgs} params
   * @returns {Promise<SushiAlert>}
   */
  async create(params) {
    const space = await alertsPrisma.create(params, this.prisma);
    this.triggerHooks('sushi-alerts:create', space);
    return space;
  }

  /**
   * @param {SushiAlertFindManyArgs} params
   * @returns {Promise<SushiAlert[]>}
   */
  findMany(params) {
    return alertsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SushiAlertFindUniqueArgs} params
   * @returns {Promise<SushiAlert | null>}
   */
  findUnique(params) {
    return alertsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {SushiAlertUpdateArgs} params
   * @returns {Promise<SushiAlert>}
   */
  async update(params) {
    const alert = await alertsPrisma.update(params, this.prisma);
    this.triggerHooks('sushi-alerts:update', alert);
    return alert;
  }

  /**
   * @param {SushiAlertUpsertArgs} params
   * @returns {Promise<SushiAlert>}
   */
  async upsert(params) {
    const alert = await alertsPrisma.upsert(params, this.prisma);
    this.triggerHooks('sushi-alerts:upsert', alert);
    return alert;
  }

  /**
   * @param {SushiAlertCountArgs} params
   * @returns {Promise<number>}
   */
  async count(params) {
    return alertsPrisma.count(params, this.prisma);
  }

  /**
   * @param {SushiAlertDeleteArgs} params
   * @returns {Promise<SushiAlert | null>}
   */
  async delete(params) {
    const result = await alertsPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    const { deleteResult, deletedAlert } = result;

    this.triggerHooks('sushi-alerts:delete', deletedAlert);
    return deleteResult;
  }

  /**
   * @param {SushiAlertDeleteManyArgs} params
   * @returns {Promise<SushiAlert[]>}
   */
  async deleteMany(params) {
    const deleted = await alertsPrisma.removeMany(params, this.prisma);
    deleted.forEach((deletedAlert) => this.triggerHooks('sushi-alerts:delete', deletedAlert));
    return deleted;
  }

  /**
   * @returns {Promise<Array<SushiAlert> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SushiAlertsService} service */
    const transaction = async (service) => {
      const alerts = await service.findMany({});

      if (alerts.length === 0) { return null; }

      await Promise.all(
        alerts.map(
          (space) => service.delete({
            where: {
              id: space.id,
            },
          }),
        ),
      );

      return alerts;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return SushiAlertsService.$transaction(transaction);
  }

  /**
   * Update HARVESTED_BUT_UNSUPPORTED alerts
   */
  async updateHarvestedButUnsupported() {
    if (!this.prisma) {
      throw new Error('No prisma initialised');
    }
    if (this.currentTransaction) {
      throw new Error("Cannot run this method in a transaction (it's a heavy and time consuming operation)");
    }

    const harvestService = new HarvestService(this);

    // Severity by harvest status
    const SEVERITY_PER_STATUS = new Map([
      ['finished', 'info'],
      ['missing', 'warning'],
      // will defaults to "error"
    ]);

    /** @type {Map<string, PrismaPromise>} */
    const operations = new Map();

    /** @type {AsyncGenerator<HarvestWithInstitutionAndEndpoint>} */
    // @ts-expect-error
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

    const existingAlerts = new Map(
      (await this.findMany({ where: { type: 'HARVESTED_BUT_UNSUPPORTED' } }))
        .map((al) => [al.id, al]),
    );

    appLogger.verbose(`[sushi-alerts][HARVESTED_BUT_UNSUPPORTED] Found [${existingAlerts.size}] existing alerts`);

    let harvestCount = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const harvest of scroller) {
      harvestCount += 1;
      // Log progress
      if (harvestCount % 10000 === 0) {
        appLogger.verbose(`[sushi-alerts][HARVESTED_BUT_UNSUPPORTED] Still processing... (Prepared [${operations.size}] operations; Analysed [${harvestCount}] harvests)`);
      }

      const id = `${harvest.credentialsId}:${harvest.reportId}:${harvest.status}`;
      // Get existing alert
      const currentAlert = existingAlerts.get(id);

      // Filter harvests with a reportId marked as "supported" in the endpoint
      // or endpoints without supportedData
      if (!harvest.credentials.endpoint.supportedData) {
        if (currentAlert) {
          existingAlerts.delete(id);
          operations.set(id, this.prisma.sushiAlert.delete({ where: { id } }));
        }
        appLogger.debug(`[sushi-alerts][HARVESTED_BUT_UNSUPPORTED] [${harvest.credentials.endpoint.id}] doesn't have supported data`);
        // eslint-disable-next-line no-continue
        continue;
      }

      // We don't need first/last month available, so we can merge all versions
      const supportedData = new Map(
        Object.values(harvest.credentials.endpoint.supportedData)
          .flatMap((data) => Object.entries(data)),
      );
      if (supportedData.get(harvest.reportId)?.supported?.value !== false) {
        if (currentAlert) {
          existingAlerts.delete(id);
          operations.set(id, this.prisma.sushiAlert.delete({ where: { id } }));
        }
        appLogger.debug(`[sushi-alerts][HARVESTED_BUT_UNSUPPORTED] [${harvest.credentials.endpoint.id}] does support ${harvest.reportId}`);
        // eslint-disable-next-line no-continue
        continue;
      }

      /** @type {SushiAlert} */
      // @ts-expect-error
      const payload = currentAlert ?? {
        id,
        type: 'HARVESTED_BUT_UNSUPPORTED',
        severity: SEVERITY_PER_STATUS.get(harvest.status) ?? 'error',

        context: {
          reportId: harvest.reportId,
          status: harvest.status,
          credentialsId: harvest.credentialsId,

          beginDate: harvest.period,
          endDate: harvest.period,

          credentials: harvest.credentials,
        },

        createdAt: new Date(),
      };

      if (isObject(payload.context)) {
        if ((payload.context.beginDate ?? '') >= harvest.period) {
          payload.context.beginDate = harvest.period;
        }
        if ((payload.context.endDate ?? '') <= harvest.period) {
          payload.context.endDate = harvest.period;
        }
      }

      existingAlerts.set(id, payload);
      operations.set(id, this.prisma.sushiAlert.upsert({
        where: { id },
        // @ts-expect-error
        create: payload,
        // @ts-expect-error
        update: payload,
      }));
    }

    appLogger.verbose(`[sushi-alerts][HARVESTED_BUT_UNSUPPORTED] Completed ! Running [${operations.size}] operations (Analysed [${harvestCount}] harvests)`);
    await SushiAlertsService.$transaction(Array.from(operations.values()));
  }

  /**
   * Update ENDPOINT alerts
   */
  async updateEndpointAlerts() {
    if (!this.prisma) {
      throw new Error('No prisma initialised');
    }
    if (this.currentTransaction) {
      throw new Error("Cannot run this method in a transaction (it's a heavy and time consuming operation)");
    }

    /** @type {Omit<SushiAlertCreateInput, 'type'>[]} */
    const alerts = [];
    const collectedAt = new Date();

    const endpointService = new EndpointsService(this);

    /** @type {SushiEndpointWithCredentials[]} */
    // @ts-expect-error
    const endpointsToDo = await endpointService.findMany({
      where: {
        active: true,
        credentials: {
          some: {
            connection: {
              path: ['status'],
              equals: 'success',
            },
          },
        },
      },
      include: {
        credentials: {
          take: 1,
        },
      },
    });

    appLogger.verbose(`[sushi-alerts][ENDPOINT] Found [${endpointsToDo.length}] endpoints to check`);

    // eslint-disable-next-line no-restricted-syntax
    for (const endpoint of endpointsToDo) {
      const credentials = endpoint.credentials.at(0);
      if (!credentials) {
        appLogger.warn(`[sushi-alerts][ENDPOINT] No credentials found for [${endpoint.id}] (shouldn't happen)`);
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const version of endpoint.counterVersions) {
        try {
          appLogger.verbose(`[sushi-alerts][ENDPOINT] Getting status for [${endpoint.id}] (using COUNTER [${version}])`);
          // eslint-disable-next-line no-await-in-loop
          let { data: statuses } = await getStatus({ ...credentials, endpoint }, version);
          if (!Array.isArray(statuses)) {
            statuses = [statuses];
          }

          statuses.forEach((status) => {
            if (status.Note) {
              appLogger.verbose(`[sushi-alerts][ENDPOINT] Found note for [${endpoint.id}]`);
              alerts.push({
                id: `${endpoint.id}:note`,
                severity: 'info',
                context: {
                  message: status.Note,
                  counterVersion: version,
                  collectedAt,
                  endpoint,
                },
              });
            }

            if (isFalse(status.Service_Active)) {
              appLogger.verbose(`[sushi-alerts][ENDPOINT] Found that service is inactive for [${endpoint.id}]`);
              alerts.push({
                id: `${endpoint.id}:inactive`,
                severity: 'error',
                context: {
                  message: 'Endpoint reported itself as inactive',
                  counterVersion: version,
                  collectedAt,
                  endpoint,
                },
              });
            }

            if (Array.isArray((status.Alerts))) {
              appLogger.verbose(`[sushi-alerts][ENDPOINT] Found [${status.Alerts.length}] alerts for [${endpoint.id}]`);
              alerts.push(
                ...status.Alerts
                  .filter((al) => !!al?.Alert)
                  .map((al, i) => ({
                    id: `${endpoint.id}:${i}`,
                    // not standard, so must have a fallback
                    severity: al.Severity || 'warning',
                    context: {
                      message: al.Alert,
                      counterVersion: version,
                      collectedAt,
                      endpoint,
                    },
                    createdAt: formatISO(al.Date_Time),
                  })),
              );
            }
          });
        } catch (err) {
          appLogger.error(`[sushi-alerts][ENDPOINT] Error while getting alerts for [${endpoint.id}] (using COUNTER [${version}]): ${err instanceof Error ? err.message : err}`);
          // eslint-disable-next-line no-continue
          continue;
        }
      }
    }

    const tx = this.prisma;
    /** @type {PrismaPromise[]} */
    const operations = alerts.map((payload) => tx.sushiAlert.upsert({
      where: { id: payload.id },
      update: { ...payload, type: 'ENDPOINT' },
      create: { ...payload, type: 'ENDPOINT' },
    }));
    // Reset all previous alerts
    operations.push(this.prisma.sushiAlert.deleteMany({
      where: {
        type: 'ENDPOINT',
        context: {
          path: ['collectedAt'],
          lt: collectedAt,
        },
      },
    }));

    appLogger.verbose(`[sushi-alerts][ENDPOINT] Completed ! Running [${operations.length}] operations (Checked [${endpointsToDo.length}] endpoints)`);
    await SushiAlertsService.$transaction(operations);
  }
};
