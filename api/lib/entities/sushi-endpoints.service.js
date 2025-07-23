// @ts-check
const config = require('config');
const {
  subMonths,
  isValid: isValidDate,
  isBefore,
} = require('date-fns');

const sushiEndpointsPrisma = require('../services/prisma/sushi-endpoints');
const BasePrismaService = require('./base-prisma.service');

const isObject = require('../utils/isObject');

const { appLogger } = require('../services/logger');
const sushiService = require('../services/sushi');

const DEFAULT_HARVESTED_REPORTS = new Set(config.get('counter.defaultHarvestedReports'));
const defaultHarvestedReports = Array.from(DEFAULT_HARVESTED_REPORTS).map((r) => r.toLowerCase());

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').SushiCredentials} SushiCredentials
 * @typedef {import('@prisma/client').SushiEndpoint} SushiEndpoint
 * @typedef {import('@prisma/client').Prisma.SushiEndpointUpdateArgs} SushiEndpointUpdateArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointUpsertArgs} SushiEndpointUpsertArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointCountArgs} SushiEndpointCountArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointFindUniqueArgs} SushiEndpointFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointFindManyArgs} SushiEndpointFindManyArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointCreateArgs} SushiEndpointCreateArgs
 * @typedef {import('@prisma/client').Prisma.SushiEndpointDeleteArgs} SushiEndpointDeleteArgs
 */
/**
 * @template DataType
 * @typedef {{ value: DataType, raw?: DataType, manual?: boolean }} SupportedDataEntry
 */
/**
 *
 * @typedef {{ supported?: SupportedDataEntry<boolean>, firstMonthAvailable?: SupportedDataEntry<string>, lastMonthAvailable?: SupportedDataEntry<string>  }} ReportSupportedData
 * @typedef {{ [reportType: string]: ReportSupportedData | undefined }} VersionSupportedData
 * @typedef {{ [version: string]: VersionSupportedData }} EndpointSupportedData
 */
/* eslint-enable max-len */

/**
 * @param {Record<string, unknown>} data - The data from endpoint
 * @returns {data is VersionSupportedData}
 */
const isVersionSupportedData = (data) => Object.values(data).some(
  (value) => isObject(value) && ['supported', 'firstMonthAvailable', 'lastMonthAvailable'].some((key) => key in value),
);

module.exports = class SushiEndpointsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<SushiEndpointsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {SushiEndpointCreateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  create(params) {
    return sushiEndpointsPrisma.create(params, this.prisma);
  }

  /**
   * @param {SushiEndpointFindManyArgs} params
   * @returns {Promise<SushiEndpoint[]>}
   */
  findMany(params) {
    return sushiEndpointsPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {SushiEndpointFindUniqueArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  findUnique(params) {
    return sushiEndpointsPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {string} id
   * @returns {Promise<SushiEndpoint | null>}
   */
  findByID(id) {
    return sushiEndpointsPrisma.findByID(id, this.prisma);
  }

  /**
   * @param {SushiEndpointUpdateArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  update(params) {
    return sushiEndpointsPrisma.update(params, this.prisma);
  }

  /**
   * @param {SushiEndpointUpsertArgs} params
   * @returns {Promise<SushiEndpoint>}
   */
  upsert(params) {
    return sushiEndpointsPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {SushiEndpointCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return sushiEndpointsPrisma.count(params, this.prisma);
  }

  /**
   * @param {SushiEndpointDeleteArgs} params
   * @returns {Promise<SushiEndpoint | null>}
   */
  async delete(params) {
    const result = await sushiEndpointsPrisma.remove(params, this.prisma);
    if (!result) {
      return null;
    }

    const { deleteResult, deletedEndpoint } = result;

    this.triggerHooks('sushi_endpoint:delete', deletedEndpoint);
    deletedEndpoint.credentials.forEach((credentials) => { this.triggerHooks('sushi_credentials:delete', credentials); });
    return deleteResult;
  }

  /**
   * @returns {Promise<Array<SushiEndpoint> | null>}
   */
  async removeAll() {
    if (process.env.NODE_ENV !== 'dev') { return null; }

    /** @param {SushiEndpointsService} service */
    const transaction = async (service) => {
      const sushiEndpoints = await service.findMany({});

      if (sushiEndpoints.length === 0) { return null; }

      await Promise.all(
        sushiEndpoints.map(
          (sushiEndpoint) => service.delete({
            where: {
              id: sushiEndpoint.id,
            },
          }),
        ),
      );

      return sushiEndpoints;
    };

    if (this.currentTransaction) {
      return transaction(this);
    }
    return SushiEndpointsService.$transaction(transaction);
  }

  /**
    * Get supported data from COUNTER endpoint using credentials
    *
    * @param {SushiCredentials & { endpoint: SushiEndpoint }} credentials
    * @param {string} [counterVersion=5] The related COUNTER version
    * @param {EndpointSupportedData} [original={}] Existing supported data
    *
    * @returns {Promise<EndpointSupportedData>}
    */
  async updateSupportedData(credentials, counterVersion = '5', original = {}) {
    const supportedData = { ...original[counterVersion] };
    appLogger.verbose(`Updating supported SUSHI reports of [${credentials.endpoint.vendor}]`);

    const isValidReport = (report) => (report.Report_ID && report.Report_Name);

    try {
      const { data } = await sushiService.getAvailableReports(credentials, counterVersion);

      if (!Array.isArray(data) || !data.every(isValidReport)) {
        throw new Error('invalid response body');
      }

      const list = new Map(data.map((report) => [report.Report_ID.toLowerCase(), report]));

      // Remove unsupported reports
      defaultHarvestedReports.forEach((reportId) => {
        const { supported, ...otherParams } = supportedData[reportId] ?? {};

        const supportedRaw = list.has(reportId);

        supportedData[reportId] = {
          supported: {
            raw: supportedRaw,
            value: supported?.manual ? supported.value : supportedRaw,
          },
          ...otherParams,
        };
      });

      // Update supported data
      data.forEach((report) => {
        const reportId = report.Report_ID.toLowerCase();

        const {
          supported,
          firstMonthAvailable,
          lastMonthAvailable,
          ...otherParams
        } = supportedData[reportId] ?? {};

        supportedData[reportId] = {
          supported: {
            raw: true,
            value: supported?.manual ? supported.value : true,
          },
          firstMonthAvailable: {
            raw: report.First_Month_Available,
            value: firstMonthAvailable?.manual
              ? firstMonthAvailable.value
              : report.First_Month_Available,
          },
          lastMonthAvailable: {
            raw: report.Last_Month_Available,
            value: lastMonthAvailable?.manual
              ? lastMonthAvailable.value
              : report.Last_Month_Available,
          },
          ...otherParams,
        };
      });
    } catch (e) {
      appLogger.warn(`Failed to update supported reports of [${credentials.endpoint.vendor}] (Reason: ${e.message})`);
    }

    await this.update({
      where: { id: credentials.endpoint.id },
      data: {
        supportedData: {
          ...original,
          [counterVersion]: supportedData,
        },
        supportedDataUpdatedAt: new Date(),
        // Remove deprecated fields to ease migration
        supportedReports: [],
        ignoredReports: [],
        additionalReports: [],
      },
    });

    return {
      ...original,
      [counterVersion]: supportedData,
    };
  }

  /**
   * Get supported reports from the old way
   *
   * @deprecated Uses old way to get data
   *
   * @param {SushiEndpoint} endpoint
   *
   * @returns {VersionSupportedData}
   */
  static #getSupportedReports({ supportedReports, ignoredReports, additionalReports }) {
    /** @type {VersionSupportedData} */
    const supportedData = {};
    supportedReports.forEach((rId) => {
      const current = supportedData[rId] ?? {};
      supportedData[rId] = { ...current, supported: { value: true, raw: true } };
    });
    additionalReports.forEach((rId) => {
      const current = supportedData[rId] ?? {};
      supportedData[rId] = { ...current, supported: { value: true, manual: true } };
    });
    ignoredReports.forEach((rId) => {
      const current = supportedData[rId] ?? {};
      supportedData[rId] = { ...current, supported: { value: false, manual: true } };
    });
    return supportedData;
  }

  /**
   * Get supported data (reports and if data is present)
   *
   * @param {SushiEndpoint} endpoint
   * @param {boolean} [forceRefreshSupported=false]
   *
   * @returns {{ expired: boolean, supported: EndpointSupportedData }}
   */
  static getSupportedData(endpoint, forceRefreshSupported = false) {
    const { supportedDataUpdatedAt } = endpoint;

    // If new format is present, merge it with old one, should be dropped once everything moved on
    const oldSupportedData = SushiEndpointsService.#getSupportedReports(endpoint);
    // eslint-disable-next-line quote-props
    let supportedData = { '5': oldSupportedData };

    if (isObject(endpoint.supportedData)) {
      const manualOldData = Object.fromEntries(
        Object.entries(oldSupportedData).filter(([, params]) => params?.supported?.manual),
      );

      /** @type {EndpointSupportedData} */
      // @ts-expect-error
      let endpointData = endpoint.supportedData;
      if (isVersionSupportedData(endpointData)) {
        const {
          // Extract supported versions, might drop later once everything moved on
          // eslint-disable-next-line quote-props
          '5': r5, '5.1': r51,
          ...reports
        } = endpointData;

        endpointData = {
          /* eslint-disable quote-props */
          '5': { ...reports, ...r5 },
          '5.1': r51,
          /* eslint-enable quote-props */
        };
      }

      supportedData = {
        ...endpointData,
        // eslint-disable-next-line quote-props
        '5': { ...oldSupportedData, ...endpointData['5'], ...manualOldData },
      };
    }

    const oneMonthAgo = subMonths(new Date(), 1);
    const hasSupportedDataExpired = forceRefreshSupported
      || !supportedDataUpdatedAt
      || !isValidDate(supportedDataUpdatedAt)
      || isBefore(supportedDataUpdatedAt, oneMonthAgo);

    return {
      expired: hasSupportedDataExpired,
      supported: supportedData,
    };
  }
};
