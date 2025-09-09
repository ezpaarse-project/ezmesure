// @ts-check
const harvestPrisma = require('../services/prisma/harvest');

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
/* eslint-enable max-len */

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
   */
  async getMatrix(
    rowGetter,
    columnGetter,
    query = {},
  ) {
    // Scroll over selected harvests
    const scroller = this.scroll(query);

    const rows = new Map();
    const headers = {
      columns: new Set(),
      rows: new Set(),
    };

    // eslint-disable-next-line no-restricted-syntax
    for await (const harvest of scroller) {
      const rowId = rowGetter(harvest);
      headers.rows.add(rowId);
      const row = rows.get(rowId) ?? new Map();

      const columnId = columnGetter(harvest);
      headers.columns.add(columnId);
      const cell = row.get(columnId) ?? {};

      // Keep last harvestedAt
      if ((cell.harvestedAt ?? 0) <= harvest.harvestedAt) {
        cell.harvestedAt = harvest.harvestedAt;
      }

      // Aggregate errors into one cell
      if (harvest.errorCode) {
        const errors = cell.errors ?? new Set();
        errors.add(harvest.errorCode);
        cell.errors = errors;
      }

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
      rows.set(rowId, row);
    }

    return {
      headers: {
        columns: Array.from(headers.columns),
        rows: Array.from(headers.rows),
      },
      rows: Array.from(rows.entries()).map(
        ([rowId, row]) => ({
          id: rowId,
          cells: Array.from(headers.columns.values()).map(
            (columnId) => {
              const cellId = `${rowId}:${columnId}`;

              const cell = row.get(columnId);
              if (!cell) {
                // fill with empty cell
                return {
                  id: cellId,
                  total: 0,
                };
              }

              const statuses = Object.entries(cell.counts)
                .sort(([, aValue], [, bValue]) => bValue - aValue)
                .map(([status]) => status);

              return {
                ...cell,
                columnId,
                id: cellId,
                // Define status based on counts
                status: statuses[0],
                // Array-ify errors
                errors: cell.errors ? Array.from(cell.errors) : [],
              };
            },
          ),
        }),
      ),
    };
  }
};
