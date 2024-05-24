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
/** @typedef {import('@prisma/client').HarvestJobStatus} HarvestJobStatus */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Institution} Institution */
/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */
/* eslint-enable max-len */

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
   * @param {object} [options]
   * @returns {Promise<{ all: SushiCredentials[], harvestable: SushiCredentials[] }>}
   */
  async getCredentials(session, options = {}) {
    if (!session.credentialsQuery || typeof session.credentialsQuery !== 'object' || Array.isArray(session.credentialsQuery)) {
      throw new HTTPError(400, 'errors.harvest.invalidQuery', [session.id]);
    }

    const where = {
      id: queryToPrismaFilter(session.credentialsQuery.sushiIds?.toString()),
      institutionId: queryToPrismaFilter(session.credentialsQuery.institutionIds?.toString()),
      endpointId: queryToPrismaFilter(session.credentialsQuery.endpointIds?.toString()),
    };

    const sushiCredentialsService = new SushiCredentialsService(this);
    const credentials = await sushiCredentialsService.findMany({ where, include: options.include });

    let harvestable = credentials;
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
   * Stat a session by creating linked jobs
   *
   * @param {HarvestSession} session - The session to check
   * @param {object} [options]
   */
  async start({ id }, options = {}) {
    /** @param {HarvestSessionService} harvestSessionService */
    const prepareJobs = async (harvestSessionService) => {
      // TODO: get credentials from service with scroll (maybe later)
      /**
       * @type {(
       *  HarvestSession & {
       *    jobs: (HarvestJob & {
       *      credentials: (SushiCredentials & {
       *        endpoint: SushiEndpoint;
       *        institution: Institution;
       *      })
       *    })[]
       *  }) | null
       * }
       */
      // @ts-ignore
      const session = await this.findUnique({
        where: { id },
        include: {
          jobs: {
            include: {
              credentials: {
                include: {
                  endpoint: true,
                  institution: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new HTTPError(404, 'errors.harvest.sessionNotFound', [id]);
      }

      // Get report types
      let reportTypes = Array.from(new Set(session.reportTypes)).map((r) => r?.toLowerCase?.());

      /** @type {(SushiCredentials & { endpoint: SushiEndpoint, institution: Institution })[]} */
      let credentialsToHarvest = [];
      if (session.jobs.length > 0) {
        // Get all credentials to harvest
        credentialsToHarvest = session.jobs.map((job) => job.credentials);

        if (!options.restartAll) {
          // Remove already ended jobs
          const harvestedCredentials = new Set(
            session.jobs
              .filter((job) => job.status === 'finished')
              .map((job) => job.credentialsId),
          );
          credentialsToHarvest = credentialsToHarvest.filter(
            (credential) => !harvestedCredentials.has(credential.id),
          );
        }
      } else {
        // Get harvestable credentials
        const { harvestable } = await harvestSessionService.getCredentials(
          session,
          { include: { endpoint: true, institution: true } },
        );
        // @ts-ignore
        credentialsToHarvest = harvestable;
      }

      // Create needed services
      const repositoriesService = new RepositoriesService(harvestSessionService);
      const endpointsService = new SushiEndpointsService(harvestSessionService);
      const harvestJobsService = new HarvestJobsService(harvestSessionService);

      // Create index cache
      const institutionIndices = new Map();

      // Start harvests jobs
      return Promise.all(
        credentialsToHarvest.map(async (credentials) => {
          const { endpoint, institution } = credentials;

          // Get index for institution
          let index = institutionIndices.get(institution.id) || '';
          if (!index) {
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

            index = repository.pattern.replace(/[*]/g, '');
            institutionIndices.set(institution.id, index);
          }

          // Get supported reports
          const {
            supportedReportsUpdatedAt,
            ignoredReports,
            additionalReports,
          } = endpoint;

          const oneMonthAgo = subMonths(new Date(), 1);

          let supportedReports = [];
          if (Array.isArray(endpoint.supportedReports)) {
            supportedReports = endpoint.supportedReports;
          }

          if (
            !supportedReportsUpdatedAt
            || !isValidDate(supportedReportsUpdatedAt)
            || isBefore(supportedReportsUpdatedAt, oneMonthAgo)
          ) {
            appLogger.verbose(`Updating supported SUSHI reports of [${credentials.endpoint.vendor}]`);

            const isValidReport = (report) => (report.Report_ID && report.Report_Name);

            try {
              const { data } = await sushiService.getAvailableReports(credentials);

              if (!Array.isArray(data) || !data.every(isValidReport)) {
                throw new Error('invalid response body');
              }

              supportedReports = data.map((report) => report.Report_ID.toLowerCase());
            } catch (e) {
              appLogger.warn(`Failed to update supported reports of [${endpoint.vendor}] (Reason: ${e.message})`);
            }

            await endpointsService.update({
              where: { id: credentials.endpoint.id },
              data: {
                supportedReports,
                supportedReportsUpdatedAt: new Date(),
              },
            });
          }

          if (reportTypes.includes('all')) {
            reportTypes = defaultHarvestedReports;
          }

          const supportedReportsSet = new Set([
            // If there's no support list available, assume the default list is supported
            ...(supportedReports.length > 0 ? supportedReports : defaultHarvestedReports),
            ...additionalReports,
          ]);
          const ignoredReportsSet = new Set(ignoredReports);

          if (!session.downloadUnsupported) {
            // Filter supported reports based on session params
            if (supportedReportsSet.size > 0) {
              reportTypes = reportTypes.filter((reportId) => supportedReportsSet.has(reportId));
            }

            // Remove reports that should be ignored
            if (ignoredReportsSet.size > 0) {
              reportTypes = reportTypes.filter((reportId) => !ignoredReportsSet.has(reportId));
            }
          }

          // Add jobs
          const jobs = await Promise.all(
            reportTypes.map(
              async (reportType) => {
                const data = {
                  /** @type {HarvestJobStatus} */
                  status: 'waiting',
                  credentials: { id: credentials.id },
                  session: { id: session.id },
                  reportType,
                  index,
                };

                const job = await harvestJobsService.findFirst({
                  where: {
                    ...data,
                    status: { not: 'finished' },
                  },
                });
                // if job exists, move it into waiting
                if (job) {
                  return harvestJobsService.update({
                    where: { id: job.id },
                    data: { status: 'waiting' },
                  });
                }
                // if not, create new job
                return harvestJobsService.create({
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
              },
            ),
          );

          if (!session.startedAt) {
            await harvestSessionService.update({
              where: { id: session.id },
              data: { startedAt: new Date() },
            });
          }

          return jobs;
        }),
      );
    };

    const jobs = await prepareJobs(this);
    return jobs.flat();
  }
};
