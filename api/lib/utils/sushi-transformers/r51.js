// @ts-check

const { format } = require('date-fns');
const { appLogger } = require('../../services/logger');

/**
 * Check if value is an record
 *
 * @param {unknown} val The value to check
 * @returns {val is Record<string, unknown>}
 */
const isRecord = (val) => !!val && typeof val === 'object' && !Array.isArray(val);

module.exports = function prepareC51Transformer(report) {
  // Extract report header
  const reportHeader = {
    Created: report?.Report_Header?.Created,
    Created_By: report?.Report_Header?.Created_By,
    Customer_ID: report?.Report_Header?.Customer_ID,
    Report_ID: report?.Report_Header?.Report_ID,
    Release: report?.Report_Header?.Release,
    Report_Name: report?.Report_Header?.Report_Name,
    Institution_Name: report?.Report_Header?.Institution_Name,

    Institution_ID: report?.Report_Header?.Institution_ID,
    Report_Filters: report?.Report_Header?.Report_Filters,
    Report_Attributes: report?.Report_Header?.Report_Attributes,
  };

  // Notify of possible changes in endpoint
  const endpoint = {};
  // Extract RegistryID (if present)
  if (report?.Report_Header?.Registry_Record) {
    try {
      const url = new URL(report.Report_Header.Registry_Record);
      const matches = /^\/platform\/(?<id>[a-z0-9-]+)\/?/i.exec(url.pathname);
      if (matches?.groups?.id) {
        endpoint.registryId = matches.groups.id;
      }
    } catch (err) {
      appLogger.warn(`[harvest] Couldn't get Registry_Record of report: ${err}`);
    }
  }

  // Extract report items
  const reportItems = Array.isArray(report?.Report_Items) ? report.Report_Items : [];
  const totalItems = reportItems.length;

  return {
    totalItems,
    endpoint,
    * transform() {
      for (let i = 0; i < reportItems.length; i += 1) {
        const parent = reportItems[i];
        let items = [parent];
        let itemParent;

        // IR-based reports have a different structure,
        // and items are nested cause some may have a parent
        if (parent.Items) {
          items = parent.Items;

          // If parent item exists
          if (parent.Item_ID) {
            itemParent = {
              Item_ID: parent.Item_ID,
              Publication_Date: parent.Publication_Date,

              Item_Name: parent.Title,
              Data_Type: parent.Data_Type,
              Authors: parent.Authors,
              Article_Version: parent.Article_Version,
            };
          }
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const reportItem of items) {
          // ? Handle reportItem.Components

          // Prepare base item
          /** @type {Record<string, any>} */
          const baseItem = {
            Report_Header: reportHeader,
            Item_Parent: itemParent,

            Item_ID: reportItem.Item_ID,
            Publication_Date: reportItem.Publication_Date,
            Publisher_ID: reportItem.Publisher_ID,

            Title: reportItem.Title,
            Item: reportItem.Item,
            Database: reportItem.Database,
            Platform: reportItem.Platform,
            Publisher: reportItem.Publisher,
            Authors: reportItem.Authors,
            Article_Version: reportItem.Article_Version,
          };

          let identifiers = [];
          if (isRecord(baseItem.Item_ID)) {
            // Extract item identifiers
            identifiers = Object.entries(baseItem.Item_ID)
              .map(([key, value]) => `${key}:${value}`)
              .sort();
          }

          const attributes = Array.isArray(reportItem?.Attribute_Performance)
            ? reportItem.Attribute_Performance
            : [];

          // eslint-disable-next-line no-restricted-syntax
          for (const attr of attributes) {
            // Prepare item
            /** @type {Record<string, any>} */
            const item = {
              ...baseItem,

              Access_Method: attr.Access_Method,
              Access_Type: attr.Access_Type,
              Data_Type: attr.Data_Type,

              YOP: attr.YOP,
            };

            // eslint-disable-next-line no-continue
            if (!isRecord(attr.Performance)) { continue; }

            const performances = Object.entries(attr.Performance);

            // eslint-disable-next-line no-restricted-syntax
            for (const [metricType, performance] of performances) {
              // eslint-disable-next-line no-continue
              if (!metricType) { continue; }

              // eslint-disable-next-line no-continue
              if (!isRecord(performance)) { continue; }

              const instances = Object.entries(performance);

              // eslint-disable-next-line no-restricted-syntax
              for (const [instanceDate, instance] of instances) {
              // eslint-disable-next-line no-continue
                if (!instanceDate) { continue; }

                const date = new Date(instanceDate);

                yield {
                  error: '',
                  date: format(date, 'yyyy-MM'),
                  performance: {
                    index: i,
                    metricType,
                    reportId: reportHeader?.Report_ID || '',
                    idComponents: [
                      item.YOP,
                      item.Access_Method,
                      item.Access_Type,
                      item.Section_Type,
                      item.Data_Type,
                      item.Platform,
                      item.Publisher,
                      item.Title,
                      item.Database,
                      ...identifiers,
                    ],
                    item: {
                      ...item,
                      Metric_Type: metricType,
                      Count: instance,
                    },
                  },
                };
              }
            }
          }
        }
      }
    },
  };
};
