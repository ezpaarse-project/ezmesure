// @ts-check
// eslint-disable-next-line max-classes-per-file
const {
  subMonths,
  isValid: isValidDate,
  isBefore,
  parse: parseDate,
  format: formatDate,
} = require('date-fns');
const config = require('config');

const { setTimeout } = require('node:timers/promises');

const harvestSessionPrisma = require('../services/prisma/harvest-session');
const sushiService = require('../services/sushi');
const { appLogger } = require('../services/logger');

const BasePrismaService = require('./base-prisma.service');
const HarvestJobsService = require('./harvest-job.service');
const RepositoriesService = require('./repositories.service');
const SushiEndpointsService = require('./sushi-endpoints.service');
const SushiCredentialsService = require('./sushi-credentials.service');
const HTTPError = require('../models/HTTPError');

const { queryToPrismaFilter } = require('../services/std-query/prisma-query');

/* eslint-disable max-len */
/** @typedef {import('@prisma/client').HarvestSession} HarvestSession */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionUpdateArgs} HarvestSessionUpdateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionUpsertArgs} HarvestSessionUpsertArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionDeleteArgs} HarvestSessionDeleteArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionFindUniqueArgs} HarvestSessionFindUniqueArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionFindFirstArgs} HarvestSessionFindFirstArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionFindManyArgs} HarvestSessionFindManyArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionAggregateArgs} HarvestSessionAggregateArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionCountArgs} HarvestSessionCountArgs */
/** @typedef {import('@prisma/client').Prisma.HarvestSessionCreateArgs} HarvestSessionCreateArgs */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsInclude} SushiCredentialsInclude */
/** @typedef {import('@prisma/client').Prisma.SushiCredentialsWhereInput} SushiCredentialsWhereInput */
/** @typedef {import('@prisma/client').HarvestJobStatus} HarvestJobStatus */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Institution} Institution */
/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */
/** @typedef {{ credentials: { include: { endpoint: true, institution: true } } }} HarvestJobCredentialsInclude */
/** @typedef {import('@prisma/client').Prisma.HarvestJobGetPayload<{ include: HarvestJobCredentialsInclude }>} HarvestJobCredentials */
/* eslint-enable max-len */

const JOB_BATCH_SIZE = 100; // Number of jobs to process per batch
const JOB_BATCH_DELAY = 100; // Time to wait between batches in ms
const DEFAULT_HARVESTED_REPORTS = new Set(config.get('counter.defaultHarvestedReports'));
const defaultHarvestedReports = Array.from(DEFAULT_HARVESTED_REPORTS).map((r) => r.toLowerCase());

module.exports = class HarvestSessionService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<HarvestSessionService>} */
  static $transaction = super.$transaction;

  /**
   * @param {string} bD Start of the period
   * @param {string} eD End of the period
   * @param {string} format Format to parse other args
   */
  static parsePeriod(bD, eD, format = 'yyyy-MM') {
    const now = new Date();
    let beginDate = bD && parseDate(bD, format, now);
    let endDate = eD && parseDate(eD, format, now);

    if (beginDate && !isValidDate(beginDate)) {
      throw new HTTPError(400, 'errors.harvest.invalidDate', [bD]);
    }
    if (endDate && !isValidDate(endDate)) {
      throw new HTTPError(400, 'errors.harvest.invalidDate', [eD]);
    }
    if (beginDate && endDate && isBefore(endDate, beginDate)) {
      throw new HTTPError(400, 'errors.harvest.invalidPeriod', [bD, eD]);
    }

    if (!bD && !eD) {
      const prevMonth = subMonths(new Date(), 1);
      beginDate = prevMonth;
      endDate = prevMonth;
    } else if (!bD) {
      beginDate = endDate;
    } else if (!eD) {
      endDate = beginDate;
    }

    return {
      beginDate,
      endDate,
    };
  }

  /**
   * Returns session status to harvest based on session params
   * @param {HarvestSession} session - The session to check
   * @returns
   */
  async getStatus({ id }) {
    /** @param {HarvestSessionService} harvestSessionService */
    const buildStatus = async (harvestSessionService) => {
      /* eslint-disable no-underscore-dangle */
      const session = await harvestSessionService.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      const harvestJobsService = new HarvestJobsService(harvestSessionService);

      // Get count of jobs by status
      const countsPerStatus = await harvestJobsService.groupBy({
        where: { sessionId: id },
        by: ['status'],
        _count: {
          _all: true,
        },
      });
      const jobStatuses = new Map(
        // @ts-ignore
        countsPerStatus.map(({ status, _count }) => [status, _count?._all ?? 0]),
      );

      // Get running time
      const timings = await harvestJobsService.aggregate({
        where: { sessionId: id },
        _min: {
          startedAt: true,
        },
        _max: {
          updatedAt: true,
        },
      });
      let runningTime;
      if (timings._max?.updatedAt && timings._min?.startedAt) {
        const updatedAt = (timings._max.updatedAt?.getTime() ?? 0);
        const startedAt = (timings._min.startedAt?.getTime() ?? 0);
        runningTime = updatedAt - startedAt;
      }

      const activeJobsCount = (jobStatuses.get('waiting') ?? 0)
        || (jobStatuses.get('delayed') ?? 0)
        || (jobStatuses.get('running') ?? 0);

      const credentials = await harvestSessionService.getCredentials(session);

      return {
        id: session.id,

        isActive: activeJobsCount > 0,
        runningTime,

        _count: {
          credentials: {
            all: credentials.all.length,
            harvestable: credentials.harvestable.length,
          },
          jobStatuses: Object.fromEntries(jobStatuses),
        },
      };
      /* eslint-enable no-underscore-dangle */
    };

    if (!this.currentTransaction) {
      // Create transaction
      return HarvestSessionService.$transaction(buildStatus);
    }
    // Use current transaction
    return buildStatus(this);
  }

  /**
   * Returns credentials to harvest based on session params
   * @param {HarvestSession} session - The session to check
   * @param {object} [options] - Options on how to get credentials
   * @returns {Promise<{ all: SushiCredentials[], harvestable: SushiCredentials[] }>}
   */
  async getCredentials(session, options = {}) {
    if (!session.credentialsQuery || typeof session.credentialsQuery !== 'object' || Array.isArray(session.credentialsQuery)) {
      throw new HTTPError(400, 'errors.harvest.invalidQuery', [session.id]);
    }

    const sushiCredentialsService = new SushiCredentialsService(this);
    const credentials = await sushiCredentialsService.findMany({
      where: {
        id: queryToPrismaFilter(session.credentialsQuery.sushiIds?.toString()),
        institutionId: queryToPrismaFilter(session.credentialsQuery.institutionIds?.toString()),
        endpointId: queryToPrismaFilter(session.credentialsQuery.endpointIds?.toString()),
        active: true,
        endpoint: {
          active: true,
        },
      },
      include: {
        endpoint: { select: { counterVersions: true } },
        ...options.include,
      },
    });

    let harvestable = credentials;
    // Remove credentials that doesn't support at least one of the requested versions
    const allowedVersions = new Set(session.allowedCounterVersions);
    harvestable = harvestable.filter(
      // @ts-ignore
      (c) => c.endpoint.counterVersions.some((v) => allowedVersions.has(v)),
    );
    // Remove credentials that have a invalid connection status
    if (!session.allowFaulty) {
      harvestable = harvestable.filter(
        // @ts-ignore
        (c) => c.connection?.status === 'success',
      );
    }

    return { all: credentials, harvestable };
  }

  /**
   * @param {HarvestSessionCreateArgs} params
   * @returns {Promise<HarvestSession>}
   */
  async create(params) {
    const props = params;
    const { beginDate, endDate } = params.data;

    const format = 'yyyy-MM';
    const period = HarvestSessionService.parsePeriod(beginDate, endDate, format);
    props.data.beginDate = formatDate(period.beginDate, format);
    props.data.endDate = formatDate(period.endDate, format);

    const session = await harvestSessionPrisma.create(props, this.prisma);

    this.triggerHooks('harvest-session:create', session);

    return session;
  }

  /**
   * @param {HarvestSessionFindManyArgs} params
   * @returns {Promise<HarvestSession[]>}
   */
  findMany(params) {
    return harvestSessionPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {HarvestSessionFindUniqueArgs} params
   * @returns {Promise<HarvestSession | null>}
   */
  findUnique(params) {
    return harvestSessionPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {HarvestSessionFindFirstArgs} params
   * @returns {Promise<HarvestSession | null>}
   */
  findFirst(params) {
    return harvestSessionPrisma.findFirst(params, this.prisma);
  }

  /**
   * @param {HarvestSessionCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return harvestSessionPrisma.count(params, this.prisma);
  }

  /**
   * @param {HarvestSessionUpdateArgs} params
   * @returns {Promise<HarvestSession>}
   */
  async update(params) {
    const session = await harvestSessionPrisma.update(params, this.prisma);

    this.triggerHooks('harvest-session:update', session);

    return session;
  }

  /**
   * @param {HarvestSessionUpsertArgs} params
   * @returns {Promise<HarvestSession>}
   */
  async upsert(params) {
    const props = params;

    // on create, ensure period is valid
    if (params.create) {
      const { beginDate, endDate } = params.create;

      const format = 'yyyy-MM';
      const period = HarvestSessionService.parsePeriod(beginDate, endDate, format);
      props.create.beginDate = formatDate(period.beginDate, format);
      props.create.endDate = formatDate(period.endDate, format);
    }

    const session = await harvestSessionPrisma.upsert(props);

    this.triggerHooks('harvest-session:upsert', session);

    return session;
  }

  /**
   * @param {HarvestSessionDeleteArgs} params
   * @returns {Promise<HarvestSession | null>}
   */
  async delete(params) {
    const result = await harvestSessionPrisma.remove(params, this.prisma);

    if (!result) { return null; }
    const { deleteResult, deletedSession } = result;

    this.triggerHooks('harvest-session:delete', deleteResult);

    deletedSession.jobs.map((job) => this.triggerHooks('harvest-job:delete', job));

    return deleteResult;
  }

  /**
   * Returns whether the session is terminated or not by checking its jobs' status
   * @param {HarvestSession} session - The session to check
   */
  async isActive(session) {
    const harvestJobsService = new HarvestJobsService(this.prisma);
    const activeJob = await harvestJobsService.findFirst({
      where: {
        sessionId: session.id,
        status: {
          notIn: HarvestJobsService.endStatuses,
        },
      },
    });

    return !!activeJob;
  }

  /**
   * Start a session by creating linked jobs
   *
   * @param {HarvestSession} session - The session to check
   * @param {object} [options] - Options on how to start the session
   * @param {boolean} [options.restartAll] - Restart all jobs instead of the ones that are failed
   * @param {boolean} [options.forceRefreshSupported] - Force refresh of supported reports
   * @param {boolean} [options.dryRun] - Do not create any jobs
   */
  async* start({ id }, options = {}) {
    const session = await this.findUnique({ where: { id } });
    if (!session) {
      throw new HTTPError(404, 'errors.harvest.sessionNotFound', [id]);
    }

    // Create needed services
    const repositoriesService = new RepositoriesService(this);
    const endpointsService = new SushiEndpointsService(this);
    const harvestJobsService = new HarvestJobsService(this);

    // TODO: get credentials from service with scroll (maybe later)
    // Get all jobs of session
    /** @type {HarvestJobCredentials[]} */
    // @ts-expect-error
    const sessionJobs = harvestJobsService.findMany({
      include: {
        credentials: {
          include: {
            endpoint: true,
            institution: true,
          },
        },
      },
    });

    // Get report types
    let reportTypes = Array.from(new Set(session.reportTypes)).map((r) => r?.toLowerCase?.());
    if (reportTypes.includes('all')) {
      reportTypes = defaultHarvestedReports;
    }

    /** @type {(SushiCredentials & { endpoint: SushiEndpoint, institution: Institution })[]} */
    let credentialsToHarvest = [];
    if (sessionJobs.length > 0) {
      // Get all credentials to harvest
      credentialsToHarvest = sessionJobs.map((job) => job.credentials);

      if (!options.restartAll) {
        // Remove already ended jobs
        const harvestedCredentials = new Set(
          sessionJobs
            .filter((job) => job.status === 'finished')
            .map((job) => job.credentialsId),
        );
        credentialsToHarvest = credentialsToHarvest.filter(
          (credential) => !harvestedCredentials.has(credential.id),
        );
      }
    } else {
      // Get harvestable credentials
      const { harvestable } = await this.getCredentials(
        session,
        { include: { endpoint: true, institution: true } },
      );
        // @ts-ignore
      credentialsToHarvest = harvestable;
    }

    const allowedVersions = new Set(session.allowedCounterVersions);

    // Create index cache
    const institutionIndexPrefixes = new Map();

    // Start harvests jobs
    const jobsPerCredential = await Promise.all(
      credentialsToHarvest.map(async (credentials) => {
        const { endpoint, institution } = credentials;
        /** @type {Record<string, { beginDate: string, endDate: string } | undefined>} */
        let harvestedReportTypes = Object.fromEntries(
          reportTypes.map((reportType) => [reportType, {
            beginDate: session.beginDate,
            endDate: session.endDate,
          }]),
        );

        // Get version that will be used, if no suitable version is found, skip this credential
        const counterVersion = endpoint.counterVersions
          .sort().reverse() // Sort from most recent to oldest
          .find((v) => allowedVersions.has(v));
        if (!counterVersion) {
          return [];
        }

        // Get index prefix for institution
        let indexPrefix = institutionIndexPrefixes.get(institution.id) || '';
        if (!indexPrefix) {
          const repository = await repositoriesService.findFirst({
            where: {
              type: 'counter5',
              institutions: {
                some: { id: institution.id },
              },
            },
          });

          if (!repository?.pattern) {
            throw new HTTPError(400, 'errors.harvest.noTarget', [institution.id]);
          }

          indexPrefix = repository.pattern.replace(/[*]/g, '');
          institutionIndexPrefixes.set(institution.id, indexPrefix);
        }

        // Get index by COUNTER version
        let index;
        switch (counterVersion) {
          case '5.1':
            index = `${indexPrefix}-r51`;
            break;

          default:
            index = indexPrefix;
            break;
        }

        // [DEPRECATED] Use old way to get supported data
        const oldSupportedData = {};
        const { supportedReports, ignoredReports, additionalReports } = endpoint;
        supportedReports.forEach((rId) => {
          const current = oldSupportedData[rId] ?? {};
          oldSupportedData[rId] = { ...current, supported: { value: true, raw: true } };
        });
        additionalReports.forEach((rId) => {
          const current = oldSupportedData[rId] ?? {};
          oldSupportedData[rId] = { ...current, supported: { value: true, manual: true } };
        });
        ignoredReports.forEach((rId) => {
          const current = oldSupportedData[rId] ?? {};
          oldSupportedData[rId] = { ...current, supported: { value: false, manual: true } };
        });

        // Get supported data
        const { supportedDataUpdatedAt } = endpoint;
        let supportedData = oldSupportedData;
        if (
          endpoint.supportedData
          && typeof endpoint.supportedData === 'object'
          && !Array.isArray(endpoint.supportedData)
        ) {
          const manualOldData = Object.fromEntries(
            Object.entries(oldSupportedData).filter(([, params]) => params?.supported?.manual),
          );
          supportedData = { ...oldSupportedData, ...endpoint.supportedData, ...manualOldData };
        }

        const oneMonthAgo = subMonths(new Date(), 1);
        const hasSupportedDataExpired = options.forceRefreshSupported
          || !supportedDataUpdatedAt
          || !isValidDate(supportedDataUpdatedAt)
          || isBefore(supportedDataUpdatedAt, oneMonthAgo);

        // Get supported reports
        if (hasSupportedDataExpired) {
          appLogger.verbose(`Updating supported SUSHI reports of [${credentials.endpoint.vendor}]`);

          const isValidReport = (report) => (report.Report_ID && report.Report_Name);

          try {
            const { data } = await sushiService.getAvailableReports(credentials);

            if (!Array.isArray(data) || !data.every(isValidReport)) {
              throw new Error('invalid response body');
            }

            const list = new Map(data.map((report) => [report.Report_ID.toLowerCase(), report]));

            // Remove unsupported reports
            Array.from(DEFAULT_HARVESTED_REPORTS).forEach((reportId) => {
              const params = supportedData[reportId];
              const { supported = {} } = params ?? {};

              supported.raw = list.has(reportId);
              if (!supported.raw && !supported.manual) {
                supported.value = false;
              }

              supportedData[reportId] = {
                ...params,
                supported,
              };
            });

            // Update supported data
            data.forEach((report) => {
              const reportId = report.Report_ID.toLowerCase();

              const {
                supported = {},
                firstMonthAvailable = {},
                lastMonthAvailable = {},
                ...otherParams
              } = supportedData[reportId] ?? {};

              supported.raw = true;
              if (supported.manual !== true) {
                supported.value = true;
              }

              firstMonthAvailable.raw = report.First_Month_Available;
              if (firstMonthAvailable.manual !== true) {
                firstMonthAvailable.value = report.First_Month_Available;
              }

              lastMonthAvailable.raw = report.Last_Month_Available;
              if (lastMonthAvailable.manual !== true) {
                lastMonthAvailable.value = report.Last_Month_Available;
              }

              supportedData[reportId] = {
                supported,
                firstMonthAvailable,
                lastMonthAvailable,
                ...otherParams,
              };
            });
          } catch (e) {
            appLogger.warn(`Failed to update supported reports of [${endpoint.vendor}] (Reason: ${e.message})`);
          }

          await endpointsService.update({
            where: { id: credentials.endpoint.id },
            data: {
              supportedData,
              supportedDataUpdatedAt: new Date(),
              // Remove deprecated fields to ease migration
              supportedReports: [],
              ignoredReports: [],
              additionalReports: [],
            },
          });
        }

        if (!session.downloadUnsupported) {
          const isSessionBeforeAvailable = (limit) => limit && isBefore(session.beginDate, limit);
          const isSessionAfterAvailable = (limit) => limit && isBefore(limit, session.endDate);

          // Filter supported reports based on session params
          harvestedReportTypes = Object.fromEntries(
            Object.entries(harvestedReportTypes).map(([reportId, params]) => {
              const {
                supported = {},
                firstMonthAvailable = {},
                lastMonthAvailable = {},
              } = supportedData[reportId] ?? {};

              if (!params || supported.value === false) {
                return [reportId, undefined];
              }

              let { beginDate, endDate } = params;
              if (isSessionBeforeAvailable(firstMonthAvailable.value)) {
                beginDate = firstMonthAvailable.value;
              }

              if (isSessionAfterAvailable(lastMonthAvailable.value)) {
                endDate = lastMonthAvailable.value;
              }

              return [reportId, { ...params, beginDate, endDate }];
            }),
          );
        }

        return Object.entries(harvestedReportTypes)
          .filter(([, params]) => !!params)
          .map(([reportType, params]) => ({
            ...params,
            /** @type {HarvestJobStatus} */
            status: 'waiting',
            credentials: { id: credentials.id },
            session: { id: session.id },
            reportType,
            index,
            counterVersion,
          }));
      }),
    );

    /**
     * Create jobs in bulk
     *
     * @param {object[]} jobs Jobs to create
     *
     * @returns {Promise<import('@prisma/client').HarvestJob[]>} Created jobs
     */
    const createJobs = async (jobs) => HarvestJobsService.$transaction(
      async (service) => Promise.all(
        jobs.map(async (data) => {
          if (options.dryRun) {
            return {
              ...data,
              credentialsId: data.credentials.id,
              sessionId: data.session.id,
            };
          }

          const job = await service.findFirst({
            where: {
              ...data,
              status: { not: 'finished' },
            },
          });
          // if job exists, move it into waiting
          if (job) {
            return service.update({
              where: { id: job.id },
              data: {
                status: 'waiting',
                beginDate: data.beginDate,
                endDate: data.endDate,
              },
            });
          }
          // if not, create new job
          return service.create({
            data: {
              ...data,
              credentials: {
                connect: data.credentials,
              },
              session: {
                connect: data.session,
              },
            },
          });
        }),
      ),
    );

    if (!options.dryRun) {
      await this.update({
        where: { id: session.id },
        data: { startedAt: new Date() },
      });
    }

    let buffer = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const jobToCreate of jobsPerCredential.flat()) {
      buffer.push(jobToCreate);
      if (buffer.length < JOB_BATCH_SIZE) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const createdJobs = await createJobs(buffer);
      buffer = [];
      yield* createdJobs;

      // eslint-disable-next-line no-await-in-loop
      await setTimeout(JOB_BATCH_DELAY); // Throttle requests to DB, avoiding connection issues
    }

    if (buffer.length > 0) {
      const createdJobs = await createJobs(buffer);
      yield* createdJobs;
    }

    if (!options.dryRun) {
      this.triggerHooks('harvest-session:start', session);
    }
  }

  /**
   * Stop a session by cancelling linked jobs
   *
   * @param {HarvestSession} session - The session to check
   */
  async* stop({ id }) {
    const harvestJobsService = new HarvestJobsService(this);

    const session = await this.findUnique({ where: { id } });
    if (!session) {
      throw new HTTPError(404, 'errors.harvest.sessionNotFound', [id]);
    }

    // Get jobs to cancel
    const jobsToCancel = await harvestJobsService.findMany({
      where: {
        sessionId: id,
      },
    });

    /**
     * Cancel jobs in bulk
     *
     * @param {import('@prisma/client').HarvestJob[]} jobs Jobs to cancel
     *
     * @returns {Promise<import('@prisma/client').HarvestJob[]>} Canceled jobs
     */
    const cancelJobs = async (jobs) => HarvestJobsService.$transaction(
      async (service) => Promise.all(
        jobs.map(async (job) => (!HarvestJobsService.isDone(job) ? service.cancel(job) : job)),
      ),
    );

    let buffer = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const job of jobsToCancel) {
      buffer.push(job);
      if (buffer.length < JOB_BATCH_SIZE) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const canceledJob = await cancelJobs(buffer);
      buffer = [];
      yield* canceledJob;

      // eslint-disable-next-line no-await-in-loop
      await setTimeout(JOB_BATCH_DELAY); // Throttle requests to DB, avoiding connection issues
    }

    if (buffer.length > 0) {
      const canceledJob = await cancelJobs(buffer);
      yield* canceledJob;
    }

    this.triggerHooks('harvest-session:stop', session);
  }
};
