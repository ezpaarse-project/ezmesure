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
const HTTPError = require('../models/HTTPError');

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
/** @typedef {import('@prisma/client').HarvestJobStatus} HarvestJobStatus */
/** @typedef {import('@prisma/client').SushiCredentials} SushiCredentials */
/** @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint */
/** @typedef {import('@prisma/client').Institution} Institution */
/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */
/* eslint-enable max-len */

const DEFAULT_HARVESTED_REPORTS = new Set(config.get('counter.defaultHarvestedReports'));

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
   * @template {SushiCredentials} T
   *
   * Returns endpoints to harvest based on session params
   * @param {HarvestSession & { credentials: T[] }} session - The session to check
   */
  static getHarvestableCredentials(session) {
    let { credentials } = session;

    if (!session.allowFaulty) {
      credentials = credentials.filter(
        // @ts-ignore
        (c) => c.connection?.status === 'success',
      );
    }

    return credentials;
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
      props.create.endDate = formatDate(period.beginDate, format);
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
   */
  async start(session) {
    /** @param {HarvestSessionService} harvestSessionService */
    const prepareJobs = async (harvestSessionService) => {
      // TODO: get credentials from service with scroll (maybe later)
      /**
       * @type {(
       *    HarvestSession
       *    & {
       *        credentials: (
       *          SushiCredentials
       *          & { endpoint: SushiEndpoint, institution: Institution }
       *        )[],
       *        jobs: HarvestJob[],
       *      }
       *  ) | null
       * }
       */
      // @ts-ignore
      const fullSession = await this.findUnique({
        where: {
          id: session.id,
        },
        include: {
          credentials: {
            include: {
              endpoint: true,
              institution: true,
            },
          },
          jobs: {
            where: {
              status: 'finished',
            },
          },
        },
      });

      if (!fullSession) {
        throw new HTTPError(404, 'errors.harvest.sessionNotFound', [session.id]);
      }

      // Get report types
      let reportTypes = Array.from(new Set(fullSession.reportTypes));

      // Filter out credentials based on session params
      let credentialsToHarvest = HarvestSessionService.getHarvestableCredentials(fullSession);

      // Remove already ended jobs
      const harvestedCredentials = new Set(fullSession.jobs.map((job) => job.credentialsId));
      credentialsToHarvest = credentialsToHarvest.filter(
        (credential) => !harvestedCredentials.has(credential.id),
      );

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
          const { supportedReportsUpdatedAt } = endpoint;
          const oneMonthAgo = subMonths(new Date(), 1);

          let supportedReports = [];
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
            reportTypes = Array.from(DEFAULT_HARVESTED_REPORTS);
          }

          const supportedReportsSet = new Set(supportedReports);

          // Filter supported report based on session params
          if (!fullSession.downloadUnsupported && supportedReportsSet.size > 0) {
            reportTypes = reportTypes.filter((reportId) => supportedReportsSet.has(reportId));
          }

          // Add jobs
          return Promise.all(
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
        }),
      );
    };

    let jobs = [];
    if (!this.currentTransaction) {
      // Create transaction
      jobs = await HarvestSessionService.$transaction(prepareJobs);
    } else {
      // Use current transaction
      jobs = await prepareJobs(this);
    }

    return jobs.flat();
  }
};
