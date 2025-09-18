// @ts-check
const harvestPrisma = require('../services/prisma/harvest');

const { enums: { HarvestJobStatus } } = require('../services/prisma');

const BasePrismaService = require('./base-prisma.service');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Harvest} Harvest
 * @typedef {import('@prisma/client').Prisma.HarvestUpdateArgs} HarvestUpdateArgs
 * @typedef {import('@prisma/client').Prisma.HarvestUpsertArgs} HarvestUpsertArgs
 * @typedef {import('@prisma/client').Prisma.HarvestFindUniqueArgs} HarvestFindUniqueArgs
 * @typedef {import('@prisma/client').Prisma.HarvestFindManyArgs} HarvestFindManyArgs
 * @typedef {import('@prisma/client').Prisma.HarvestCountArgs} HarvestCountArgs
 * @typedef {import('@prisma/client').Prisma.HarvestCreateArgs} HarvestCreateArgs
 * @typedef {import('@prisma/client').Prisma.HarvestDeleteManyArgs} HarvestDeleteManyArgs
 * @typedef {import('@prisma/client').Prisma.HarvestGroupByArgs} HarvestGroupByArgs
 * @typedef {import('@prisma/client').Prisma.HarvestInclude} HarvestInclude
 */

/**
 * @typedef {object} HarvestMatrixCell
 * @property {string} id
 * @property {string} columnId
 * @property {string} status
 * @property {Date} harvestedAt
 * @property {string[]} counterVersions
 * @property {string[]} reportIds
 * @property {number} total
 * @property {Record<string, number>} counts
 *
 * @property {object} items
 * @property {number} items.inserted
 * @property {number} items.updated
 * @property {number} items.failed
 *
 * @property {object} period
 * @property {string} period.beginDate
 * @property {string} period.endDate
 */
/**
 * @typedef {object} HarvestMatrixRow
 * @property {string} id
 * @property {number} weight
 * @property {HarvestMatrixCell[]} cells
 */
/**
 * @typedef {object} HarvestMatrix
 * @property {HarvestMatrixRow[]} rows
 *
 * @property {object} headers
 * @property {any[]} headers.columns
 * @property {any[]} headers.rows
 */
/* eslint-enable max-len */

const HARVEST_MATRIX_STATUS_WEIGHT = new Map([
  [HarvestJobStatus.running, 5],
  [HarvestJobStatus.delayed, 5],
  [HarvestJobStatus.waiting, 5],
  [HarvestJobStatus.finished, 4],
  ['missing', 3],
  [HarvestJobStatus.failed, 2],
  [HarvestJobStatus.interrupted, 1],
  [HarvestJobStatus.cancelled, 1],
]);

module.exports = class HarvestsService extends BasePrismaService {
  /** @type {BasePrismaService.TransactionFnc<HarvestsService>} */
  static $transaction = super.$transaction;

  /**
   * @param {HarvestCreateArgs} params
   * @returns {Promise<Harvest>}
   */
  create(params) {
    return harvestPrisma.create(params, this.prisma);
  }

  /**
   * @param {HarvestFindManyArgs} params
   * @returns {Promise<Harvest[]>}
   */
  findMany(params) {
    return harvestPrisma.findMany(params, this.prisma);
  }

  /**
   * @param {HarvestFindUniqueArgs} params
   * @returns {Promise<Harvest | null>}
   */
  findUnique(params) {
    return harvestPrisma.findUnique(params, this.prisma);
  }

  /**
   * @param {HarvestCountArgs} params
   * @returns {Promise<number>}
   */
  count(params) {
    return harvestPrisma.count(params, this.prisma);
  }

  /**
   * @param {HarvestUpdateArgs} params
   * @returns {Promise<Harvest>}
   */
  update(params) {
    return harvestPrisma.update(params, this.prisma);
  }

  /**
   * @param {HarvestUpsertArgs} params
   * @returns {Promise<Harvest>}
   */
  upsert(params) {
    return harvestPrisma.upsert(params, this.prisma);
  }

  /**
   * @param {HarvestDeleteManyArgs} params
   * @returns {Promise<number>}
   */
  deleteMany(params) {
    return harvestPrisma.removeMany(params, this.prisma);
  }

  /**
   * @param {HarvestGroupByArgs} params
   * @returns
   */
  groupBy(params) {
    return harvestPrisma.groupBy(params, this.prisma);
  }

  /**
   * Scroll through harvests
   *
   * @param {Omit<HarvestFindManyArgs, 'skip' | 'cursor' | 'orderBy'>} [query]
   *
   * @returns {AsyncGenerator<Harvest>}
   */
  async* scroll(query = {}) {
    let skip = 0;
    const take = query.take || 5000;

    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const data = await harvestPrisma.findMany({
        ...query,
        // Cursor pagination
        take,
        skip,
        // Sort by cursor
        orderBy: [
          { credentialsId: 'asc' },
          { reportId: 'asc' },
          { period: 'asc' },
        ],
      }, this.prisma);

      yield* data;

      if (data.length < take) {
        break;
      }

      // Update cursor
      skip += data.length;
    }
  }

  /**
   * Get harvest matrix
   *
   * @param {(harvest: Harvest) => unknown} rowGetter
   * @param {(harvest: Harvest) => unknown} columnGetter
   * @param {Omit<HarvestFindManyArgs, 'skip' | 'cursor' | 'orderBy'>} [query]
   *
   * @returns {Promise<HarvestMatrix>}
   */
  async getMatrix(
    rowGetter,
    columnGetter,
    query = {},
  ) {
    const scrollQuery = query;
    scrollQuery.include = {
      harvestedBy: { select: { counterVersion: true } },
      ...scrollQuery.include,
    };

    // Scroll over selected harvests
    const scroller = this.scroll(scrollQuery);

    const rowsMap = new Map();
    const headers = {
      columns: new Set(),
      rows: new Set(),
    };

    // eslint-disable-next-line no-restricted-syntax
    for await (const harvest of scroller) {
      const rowId = rowGetter(harvest);
      headers.rows.add(rowId);
      const row = rowsMap.get(rowId) ?? new Map();

      const columnId = columnGetter(harvest);
      headers.columns.add(columnId);
      const cell = row.get(columnId) ?? {};

      // Keep last harvestedAt
      if ((cell.harvestedAt ?? 0) <= harvest.harvestedAt) {
        cell.harvestedAt = harvest.harvestedAt;
      }

      // Aggregate counter versions if available
      // @ts-expect-error
      if (harvest.harvestedBy) {
        const counterVersions = cell.counterVersions ?? new Set();
        // @ts-expect-error
        counterVersions.add(harvest.harvestedBy.counterVersion);
        cell.counterVersions = counterVersions;
      }

      // Aggregate errors into one cell
      if (harvest.errorCode) {
        const errors = cell.errors ?? new Set();
        errors.add(harvest.errorCode);
        cell.errors = errors;
      }

      // Aggregate report ids into one cell
      cell.reportIds = cell.reportIds ?? new Set();
      cell.reportIds.add(harvest.reportId);

      // Aggregate period
      cell.period = cell.period ?? { beginDate: harvest.period, endDate: harvest.period };
      if (cell.period.beginDate >= harvest.period) {
        cell.period.beginDate = harvest.period;
      }
      if (cell.period.endDate <= harvest.period) {
        cell.period.endDate = harvest.period;
      }

      // Aggregate counts into one cell
      cell.total = (cell.total ?? 0) + 1;
      cell.counts = {
        ...cell.counts,
        [harvest.status]: (cell.counts?.[harvest.status] ?? 0) + 1,
      };
      cell.items = {
        inserted: (cell.items?.inserted ?? 0) + harvest.insertedItems,
        updated: (cell.items?.updated ?? 0) + harvest.updatedItems,
        failed: (cell.items?.failed ?? 0) + harvest.failedItems,
      };

      row.set(columnId, cell);
      rowsMap.set(rowId, row);
    }

    const columns = Array.from(headers.columns).sort();

    // Map rows as object
    const rows = Array.from(rowsMap.entries()).map(([rowId, row]) => {
      let weight = 0;
      let nonEmptyCells = 0;

      // Get status and fill with empty cells
      const cells = columns.map((columnId) => {
        const cellId = `${rowId}:${columnId}`;

        const cell = row.get(columnId);
        if (!cell) {
          // fill with empty cell
          return {
            id: cellId,
            columnId,

            total: 0,
          };
        }

        nonEmptyCells += 1;

        // Define status based on counts
        const [[status]] = Object.entries(cell.counts)
          .sort(([, aValue], [, bValue]) => bValue - aValue);

        weight += HARVEST_MATRIX_STATUS_WEIGHT.get(status) ?? 1;

        return {
          ...cell,

          id: cellId,
          columnId,

          status,

          // Array-ify counter versions, reports & errors
          counterVersions: Array.from(cell.counterVersions ?? []).sort(),
          errors: Array.from(cell.errors ?? []).sort(),
          reportIds: Array.from(cell.reportIds ?? []).sort(),
        };
      });

      return {
        id: rowId,
        weight: weight / (nonEmptyCells || 1), // if every cell is empty, weight should be 0 anyway
        cells,
      };
    });

    return {
      headers: {
        columns,
        rows: Array.from(headers.rows),
      },
      rows: rows.sort((rowA, rowB) => rowB.weight - rowA.weight),
    };
  }
};
