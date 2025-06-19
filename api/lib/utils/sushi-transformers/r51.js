// @ts-check

const { format } = require('date-fns');

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

  // Extract report items
  const reportItems = Array.isArray(report?.Report_Items) ? report.Report_Items : [];
  const totalItems = reportItems.length;

  return {
    totalItems,
    * transform() {
      for (let i = 0; i < reportItems.length; i += 1) {
        const reportItem = reportItems[i];

        // Prepare base item
        /** @type {Record<string, any>} */
        const baseItem = {
          Report_Header: reportHeader,

          Item_ID: reportItem.Item_ID,
          // TODO: check doc (and test) and look for that
          // Item_Dates: reportItem.Item_Dates,
          // Item_Attributes: reportItem.Item_Attributes,
          // Publisher_ID: reportItem.Publisher_ID,

          // TODO: check doc (and test) and look for that
          Title: reportItem.Title,
          // Item: reportItem.Item,
          // Database: reportItem.Database,
          Platform: reportItem.Platform,
          Publisher: reportItem.Publisher,
          // YOP: reportItem.YOP,
          // Section_Type: reportItem.Section_Type,
          // Access_Type: reportItem.Access_Type,
          // Item_Contributors: reportItem.Item_Contributors,
        };

        // Extract item parent
        // TODO: check doc (and test) and look for that
        // const itemParent = reportItem.Item_Parent;
        // if (itemParent) {
        //   item.Item_Parent = {
        //     Item_ID: itemParent.Item_ID,
        //     Item_Dates: itemParent.Item_Dates,
        //     Item_Attributes: itemParent.Item_Attributes,

        //     Item_Name: itemParent.Item_Name,
        //     Data_Type: itemParent.Data_Type,
        //     Item_Contributors: itemParent.Item_Contributors,
        //   };
        // }

        // Extract item identifiers
        const identifiers = Object.entries(baseItem.Item_ID)
          .map(([key, value]) => `${key}:${value}`)
          .sort();

        const attributes = Array.isArray(report?.Attribute_Performance)
          ? report.Attribute_Performance
          : [];

        // eslint-disable-next-line no-restricted-syntax
        for (const attr of attributes) {
          // Prepare item
          /** @type {Record<string, any>} */
          const item = {
            ...baseItem,

            Access_Method: attr.Access_Method,
            Data_Type: attr.Data_Type,
          };

          // TODO: safe entries
          const performances = Object.entries(attr.Performance ?? {});
          // eslint-disable-next-line no-restricted-syntax
          for (const [metricType, performance] of performances) {
            // eslint-disable-next-line no-continue
            if (!metricType) { continue; }

            // TODO: safe entries
            const instances = Object.entries(performance ?? {});

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
                    // Period: period,
                  },
                },
              };
            }
          }
        }
      }
    },
  };
};
