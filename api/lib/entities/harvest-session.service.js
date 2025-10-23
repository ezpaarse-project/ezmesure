// @ts-check
const {
  subMonths,
  isValid: isValidDate,
  isBefore,
  parse: parseDate,
  format: formatDate,
  max,
} = require('date-fns');
const config = require('config');

const { setTimeout } = require('node:timers/promises');

const harvestSessionPrisma = require('../services/prisma/harvest-session');

const BasePrismaService = require('./base-prisma.service');
const HarvestJobsService = require('./harvest-job.service');
const RepositoriesService = require('./repositories.service');
const SushiEndpointsService = require('./sushi-endpoints.service');
const SushiCredentialsService = require('./sushi-credentials.service');
const HTTPError = require('../models/HTTPError');

const { queryToPrismaFilter } = require('../services/std-query/prisma-query');
const { appLogger } = require('../services/logger');

/* eslint-disable max-len */
/**
 * @typedef {import('../.prisma/client').HarvestSession} HarvestSession
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionUpdateArgs} HarvestSessionUpdateArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionUpsertArgs} HarvestSessionUpsertArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionDeleteArgs} HarvestSessionDeleteArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionFindUniqueArgs} HarvestSessionFindUniqueArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionFindFirstArgs} HarvestSessionFindFirstArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionFindManyArgs} HarvestSessionFindManyArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionAggregateArgs} HarvestSessionAggregateArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionCountArgs} HarvestSessionCountArgs
 * @typedef {import('../.prisma/client').Prisma.HarvestSessionCreateArgs} HarvestSessionCreateArgs
 * @typedef {import('../.prisma/client').SushiCredentials} SushiCredentials
 * @typedef {import('../.prisma/client').Prisma.SushiCredentialsInclude} SushiCredentialsInclude
 * @typedef {import('../.prisma/client').Prisma.SushiCredentialsWhereInput} SushiCredentialsWhereInput
 * @typedef {import('../.prisma/client').HarvestJobStatus} HarvestJobStatus
 * @typedef {import('../.prisma/client').SushiEndpoint} SushiEndpoint
 * @typedef {import('../.prisma/client').Institution} Institution
 * @typedef {import('../.prisma/client').HarvestJob} HarvestJob
 * @typedef {{ credentials: { include: { endpoint: true, institution: true } } }} HarvestJobCredentialsInclude
 * @typedef {import('../.prisma/client').Prisma.HarvestJobGetPayload<{ include: HarvestJobCredentialsInclude }>} HarvestJobCredentials
 * @typedef {import('./sushi-endpoints.service').VersionSupportedData} VersionSupportedData
 *
 * @typedef {Record<'beginDate' | 'endDate', string>} HarvestPeriod
 */
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
   * Is given period is requesting data before the given limit.
   *
   * @param {HarvestPeriod} period - The period to check
   * @param {Date | number | string | undefined} limit - The limit
   *
   * @returns {boolean}
   */
  static isBeginBeforeLimit(period, limit) {
    if (!limit) {
      return false;
    }

    return isBefore(period.beginDate, limit);
  }

  /**
   * Is given period is requesting data after the given limit.
   *
   * @param {HarvestPeriod} period - The period to check
   * @param {Date | number | string | undefined} limit - The limit
   *
   * @returns {boolean}
   */
  static isEndAfterLimit(period, limit) {
    if (!limit) {
      return false;
    }

    return isBefore(limit, period.endDate);
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
        ...SushiCredentialsService.enabledCredentialsQuery,
        id: queryToPrismaFilter(session.credentialsQuery.sushiIds?.toString()),
        institutionId: queryToPrismaFilter(session.credentialsQuery.institutionIds?.toString()),
        endpointId: queryToPrismaFilter(session.credentialsQuery.endpointIds?.toString()),
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
   * Returns whether the session is terminated or not
   * @param {HarvestSession} session - The session to check
   */
  static isActive(session) {
    return session.status === 'starting' || session.status === 'running';
  }

  /* eslint-disable max-len */
  /**
   * @typedef {import('../.prisma/client').Prisma.SushiCredentialsGetPayload<{ include: { endpoint: true, institution: true } }>} CredentialsToHarvest
   * @typedef {Partial<HarvestJob> & { credentials: { id: string }, session: { id: string }, repository: { pattern: string } }} BaseHarvestJob
   */
  /* eslint-enable max-len */

  /**
   * Get credentials to start with a session
   *
   * @param {HarvestSession} session - The session to check
   * @param {boolean} [restartAll=false] - Restart all jobs instead of the ones that are failed
   *
   * @returns {Promise<CredentialsToHarvest[]>} Credentials
   */
  async #getCredentialsToStart(session, restartAll = false) {
    const harvestJobsService = new HarvestJobsService(this);

    // TODO: get credentials from service with scroll (maybe later)
    // Get all jobs of session
    /** @type {HarvestJobCredentials[]} */
    // @ts-expect-error
    const sessionJobs = await harvestJobsService.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        credentials: {
          include: {
            endpoint: true,
            institution: true,
          },
        },
      },
    });

    if (sessionJobs.length <= 0) {
      const { harvestable } = await this.getCredentials(
        session,
        { include: { endpoint: true, institution: true } },
      );

      // @ts-expect-error
      return harvestable;
    }

    appLogger.verbose(`[harvest-start][${session.id}] Session already have [${sessionJobs.length}] jobs, restarting them (restartAll=${restartAll})`);

    // Get all credentials to harvest
    const credentialsToHarvest = sessionJobs.map((job) => job.credentials);
    if (restartAll) {
      return credentialsToHarvest;
    }

    // Remove already ended jobs
    const harvestedCredentials = new Set(
      sessionJobs
        .filter((job) => job.status === 'finished')
        .map((job) => job.credentialsId),
    );

    return credentialsToHarvest.filter((credential) => !harvestedCredentials.has(credential.id));
  }

  /**
   * Get reports to harvest for given session and endpoint
   *
   * @param {HarvestSession} session -
   * @param {SushiEndpoint} endpoint - The endpoint to check
   * @param {VersionSupportedData} supportedData - Supported data of endpoint
   *
   * @returns {Generator<{ reportType: string, params: HarvestPeriod }>} The reports to
   * harvest with specific params
   */
  static* #getReportsToHarvestForEndpoint(session, endpoint, supportedData) {
    // Get report types
    let reportTypes = Array.from(new Set(session.reportTypes)).map((r) => r?.toLowerCase?.());
    if (reportTypes.includes('all')) {
      appLogger.verbose(`[harvest-start][${session.id}] Found [all] as reportType, using [${defaultHarvestedReports}]`);
      reportTypes = defaultHarvestedReports;
    }

    appLogger.verbose(`[harvest-start][${session.id}] Found [${reportTypes.length}] reportTypes`);

    /** @type {{ reportType: string, params: HarvestPeriod }[]} */
    const harvestedReportTypes = reportTypes.map((reportType) => ({
      reportType,
      params: {
        beginDate: session.beginDate,
        endDate: session.endDate,
      },
    }));

    if (session.downloadUnsupported) {
      yield* harvestedReportTypes;
      return;
    }

    // Filter supported reports based on session params
    // eslint-disable-next-line no-restricted-syntax
    for (const { reportType, params } of harvestedReportTypes) {
      const {
        supported,
        firstMonthAvailable,
        lastMonthAvailable,
      } = supportedData[reportType] ?? {};

      // If report is not supported
      if (!params || supported?.value === false) {
        appLogger.verbose(`[harvest-start][${session.id}] [${reportType}] is not supported for [${endpoint.id}]`);
        // eslint-disable-next-line no-continue
        continue;
      }

      let { beginDate, endDate } = params;

      if (firstMonthAvailable?.value) {
        // If session requests data before available data, skip the report
        if (!HarvestSessionService.isEndAfterLimit(session, firstMonthAvailable.value)) {
          appLogger.verbose(`[harvest-start][${session.id}] Period is not compatible with [${reportType}] of [${endpoint.id}] availability`);
          // eslint-disable-next-line no-continue
          continue;
        }

        if (HarvestSessionService.isBeginBeforeLimit(session, firstMonthAvailable.value)) {
          appLogger.verbose(`[harvest-start][${session.id}] Restricting [${reportType}] of [${endpoint.id}] from [${firstMonthAvailable.value}]`);
          beginDate = firstMonthAvailable.value;
        }
      }

      if (lastMonthAvailable?.value) {
        // If session requests data after available data, skip the report
        if (!HarvestSessionService.isBeginBeforeLimit(session, lastMonthAvailable.value)) {
          appLogger.verbose(`[harvest-start][${session.id}] Period is not compatible with [${reportType}] of [${endpoint.id}] availability`);
        }

        if (HarvestSessionService.isEndAfterLimit(session, lastMonthAvailable.value)) {
          appLogger.verbose(`[harvest-start][${session.id}] Restricting [${reportType}] of [${endpoint.id}] to [${lastMonthAvailable.value}]`);
          endDate = lastMonthAvailable.value;
        }
      }

      yield { reportType, params: { ...params, beginDate, endDate } };
    }
  }

  /**
   * Get version that will be used
   *
   * @param {HarvestSession} session - The harvest session to check
   * @param {SushiEndpoint} endpoint - The endpoint to check
   *
   * @return {Generator<({ version: string } & HarvestPeriod)>} The versions with period of validity
   */
  static* #getCounterVersionForEndpoint(session, endpoint) {
    const allowedVersions = new Set(session.allowedCounterVersions);

    const availableVersions = endpoint.counterVersions
      .filter((v) => allowedVersions.has(v))
      // Sort from most recent to oldest (6 -> 5.2 -> 5.1 -> 5 -> ...)
      .sort((a, b) => (b > a ? 1 : -1));

    appLogger.verbose(`[harvest-start][${session.id}] Found following counter versions for [${endpoint.id}]: [${availableVersions}]`);

    // If no version are found, skip credentials
    if (availableVersions.length <= 0) {
      return;
    }

    const haveAvailability = !!endpoint.counterVersionsAvailability
      && typeof endpoint.counterVersionsAvailability === 'object'
      && !Array.isArray(endpoint.counterVersionsAvailability);

    // If availability cannot be used, assume latest version is correct
    if (!haveAvailability) {
      appLogger.verbose(`[harvest-start][${session.id}] No availability set, defaulting to COUNTER [${availableVersions[0]}]`);
      yield {
        version: availableVersions[0],
        beginDate: session.beginDate,
        endDate: session.endDate,
      };
      return;
    }

    let remainingPeriod = {
      beginDate: session.beginDate,
      endDate: session.endDate,
    };

    // Split by availability period
    // eslint-disable-next-line no-restricted-syntax
    for (const version of availableVersions) {
      // If period is invalid (can happen if whole session is processed), stop
      if (isBefore(remainingPeriod.endDate, remainingPeriod.beginDate)) {
        appLogger.verbose(`[harvest-start][${session.id}] All versions are processed`);
        return;
      }

      const firstMonthAvailable = endpoint.counterVersionsAvailability?.[version] ?? '';
      // If no availability is provided, setup a job for the remaining period
      if (!firstMonthAvailable || typeof firstMonthAvailable !== 'string') {
        yield {
          version,
          beginDate: remainingPeriod.beginDate,
          endDate: remainingPeriod.endDate,
        };
        appLogger.verbose(`[harvest-start][${session.id}] Preparing job for [${remainingPeriod.beginDate}] - [${remainingPeriod.endDate}] with COUNTER [${version}]. All versions are processed`);
        return;
      }

      if (HarvestSessionService.isEndAfterLimit(remainingPeriod, firstMonthAvailable)) {
        const beginDate = formatDate(max([firstMonthAvailable, remainingPeriod.beginDate]), 'yyyy-MM');

        yield {
          version,
          beginDate,
          endDate: remainingPeriod.endDate,
        };
        appLogger.verbose(`[harvest-start][${session.id}] Preparing job for [${beginDate}] - [${remainingPeriod.endDate}] with COUNTER [${version}]`);

        remainingPeriod = {
          beginDate: remainingPeriod.beginDate,
          // We remove one month to avoid requesting 2 times the same months
          // (endDate SHOULD be inclusive)
          endDate: formatDate(subMonths(firstMonthAvailable, 1), 'yyyy-MM'),
        };
      }
    }
  }

  /**
   * Get index (and cache it) for a given institution and a given counter version
   *
   * @param {Institution} institution - The institution
   * @param {string} counterVersion - The version of COUNTER
   * @param {Map<string, string>} cache - The cache
   *
   * @return {Promise<{ pattern?: string, index?: string }>} The index & repository
   */
  async #getIndexForInstitution(institution, counterVersion, cache) {
    let pattern = cache.get(institution.id);
    if (!pattern) {
      const repositoriesService = new RepositoriesService(this);

      const repository = await repositoriesService.findFirst({
        where: {
          type: 'counter5',
          institutions: {
            some: { id: institution.id },
          },
        },
      });

      if (!repository?.pattern) {
        return {};
      }

      pattern = repository.pattern;
      cache.set(institution.id, pattern);
    }

    const prefix = pattern.replace(/[*]/g, '');
    // Get index by COUNTER version
    let index;
    switch (counterVersion) {
      case '5.1':
        index = `${prefix}-r51`;
        break;

      default:
        index = prefix;
        break;
    }
    return { pattern, index };
  }

  /**
   * Get jobs to create for given list of SUSHI credentials
   *
   * @param {HarvestSession} session - The session
   * @param {CredentialsToHarvest[]} credentialsList - The credentials to check
   * @param {*} state - Various caches and options
   *
   * @returns {AsyncGenerator<BaseHarvestJob>}
   */
  async* #getJobsForCredentials(session, credentialsList, state) {
    // eslint-disable-next-line no-restricted-syntax
    for (const credentials of credentialsList) {
      const { endpoint, institution } = credentials;

      const endpointData = SushiEndpointsService.getSupportedData(
        endpoint,
        state.forceRefreshSupported,
      );

      const counterVersions = HarvestSessionService.#getCounterVersionForEndpoint(
        session,
        endpoint,
      );

      // eslint-disable-next-line no-restricted-syntax
      for (const { version, beginDate, endDate } of counterVersions) {
        const {
          pattern,
          index,
        // eslint-disable-next-line no-await-in-loop
        } = await this.#getIndexForInstitution(
          institution,
          version,
          state.institutionPatterns,
        );

        if (!index || !pattern) {
          throw new HTTPError(400, 'errors.harvest.noTarget', [institution.id]);
        }

        appLogger.verbose(`[harvest-start][${session.id}] Found index [${index}] for [${institution.id}]`);

        if (endpointData.expired) {
          const endpointService = new SushiEndpointsService(this);

          // eslint-disable-next-line no-await-in-loop
          endpointData.supported = await endpointService.updateSupportedData(
            credentials,
            version,
            endpointData.supported,
          );
        }

        const harvestedReportTypes = HarvestSessionService.#getReportsToHarvestForEndpoint(
          { ...session, beginDate, endDate },
          endpoint,
          endpointData.supported[version] ?? {},
        );

        // eslint-disable-next-line no-restricted-syntax
        for (const { reportType, params } of harvestedReportTypes) {
          if (params) {
            yield {
              ...params,
              status: 'waiting',
              repository: { pattern },
              credentials: { id: credentials.id },
              session: { id: session.id },
              reportType,
              index,
              counterVersion: version,
            };
          }
        }
      }
    }
  }

  /**
   * Start a session by creating linked jobs
   *
   * @param {HarvestSession} session - The session to check
   * @param {object} [options] - Options on how to start the session
   * @param {boolean} [options.restartAll] - Restart all jobs instead of the ones that are failed
   * @param {boolean} [options.forceRefreshSupported] - Force refresh of supported reports
   * @param {boolean} [options.dryRun] - Do not create any jobs
   *
   * @returns Iterator of generated jobs
   */
  async* start({ id }, options = {}) {
    const session = await this.findUnique({ where: { id } });
    if (!session) {
      throw new HTTPError(404, 'errors.harvest.sessionNotFound', [id]);
    }

    // Changing status to starting as we'll resolve endpoints, versions, etc.
    if (!options.dryRun) {
      await this.update({
        where: { id: session.id },
        data: { status: 'starting' },
      });
    }

    appLogger.verbose(`[harvest-start][${session.id}] Attempting to start session`);

    const credentialsToHarvest = await this.#getCredentialsToStart(session, options.restartAll);
    appLogger.verbose(`[harvest-start][${session.id}] Found [${credentialsToHarvest.length}] credentials to harvest`);

    // Create pattern cache
    const institutionPatterns = new Map();

    // Get harvests jobs, using Array.fromAsync to wait for the whole iterator before continuing
    const jobList = await Array.fromAsync(
      this.#getJobsForCredentials(session, credentialsToHarvest, {
        institutionPatterns,
        forceRefreshSupported: options.forceRefreshSupported,
      }),
    );
    appLogger.verbose(`[harvest-start][${session.id}] Prepared [${jobList.length}] jobs to start`);

    /**
     * Create jobs in bulk
     *
     * @param {object[]} jobs Jobs to create
     *
     * @returns {Promise<import('../.prisma/client').HarvestJob[]>} Created jobs
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
              repositoryPattern: undefined,
              repository: {
                connect: data.repository,
              },
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

    if (options.dryRun) {
      appLogger.verbose(`[harvest-start][${session.id}] Running in dry mode, no real updates are done`);
    }

    let buffer = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const jobToCreate of jobList) {
      buffer.push(jobToCreate);
      if (buffer.length < JOB_BATCH_SIZE) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const createdJobs = await createJobs(buffer);
      appLogger.verbose(`[harvest-start][${session.id}] Created [${createdJobs.length}] jobs`);
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
   *
   * @return Iterator of cancelled jobs
   */
  async* stop({ id }) {
    const harvestJobsService = new HarvestJobsService(this);

    const session = await this.findUnique({ where: { id } });
    if (!session) {
      throw new HTTPError(404, 'errors.harvest.sessionNotFound', [id]);
    }

    await this.update({
      where: { id: session.id },
      data: { status: 'stopping' },
    });

    // Get jobs to cancel
    const jobsToCancel = await harvestJobsService.findMany({
      where: {
        sessionId: id,
      },
    });

    /**
     * Cancel jobs in bulk
     *
     * @param {import('../.prisma/client').HarvestJob[]} jobs Jobs to cancel
     *
     * @returns {Promise<import('../.prisma/client').HarvestJob[]>} Canceled jobs
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
