// @ts-check

const { differenceInMilliseconds } = require('date-fns');
const HarvestJobsService = require('../entities/harvest-job.service');

/** @typedef {import('@prisma/client').HarvestJob} HarvestJob */

module.exports = class HarvestRequest {
  /**
   * @param {HarvestJob} job
   */
  constructor(job) {
    this.id = job.harvestId;
    this.beginDate = job.beginDate;
    this.endDate = job.endDate;
    this.createdAt = job.createdAt;

    this.lastUpdatedAt = undefined;
    this.jobCount = 0;
    this.isActive = false;
    this.runningTime = undefined;

    this.reportTypes = new Set();
    this.endpoints = new Set();
    this.institutions = new Set();
    this.statuses = new Map();
  }

  /**
   * @param {HarvestJob} job
   */
  addJob(job) {
    this.jobCount += 1;

    this.statuses.set(job.status, (this.statuses.get(job.status) || 0) + 1);
    this.reportTypes.add(job.reportType);
    if (job.credentials) {
      this.endpoints.add(job.credentials.endpointId);
      this.institutions.add(job.credentials.institutionId);
    }

    if (!this.isActive) {
      this.isActive = !HarvestJobsService.isDone(job);
    }

    if (job.updatedAt > (this.lastUpdatedAt ?? 0)) {
      this.lastUpdatedAt = job.updatedAt;
    }
  }

  calcRunningTime() {
    if (this.isActive) {
      this.runningTime = differenceInMilliseconds(new Date(), this.createdAt);
      return this.runningTime;
    }

    this.runningTime = differenceInMilliseconds(this.lastUpdatedAt ?? 0, this.createdAt);
    return this.runningTime;
  }

  getMetrics() {
    const failed = (this.statuses.get('failed') ?? 0)
            + (this.statuses.get('interrupted') ?? 0)
            + (this.statuses.get('cancelled') ?? 0)
            + (this.statuses.get('delayed') ?? 0);

    const success = this.statuses.get('finished') ?? 0;

    const active = this.statuses.get('running') ?? 0;

    return {
      success,
      failed,
      active,
      pending: this.jobCount - success - failed - active,
    };
  }

  toJSON() {
    return {
      id: this.id,
      isActive: this.isActive,
      beginDate: this.beginDate,
      endDate: this.endDate,

      runningTime: this.calcRunningTime(),

      statuses: Object.fromEntries(this.statuses),
      metrics: this.getMetrics(),
      counts: {
        jobs: this.jobCount,
        reportTypes: this.reportTypes.size,
        endpoints: this.endpoints.size,
        institutions: this.institutions.size,
      },

      createdAt: this.createdAt,
      updatedAt: this.lastUpdatedAt,
    };
  }
};
