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
              // Item_Dates was renamed into Publication_Date
              // // Item_Dates: parent.Item_Dates,
              Publication_Date: parent.Publication_Date,

              Item: parent.Item,
              // ? Item_Name was renamed into Item
              // // Item_Name: parent.Item_Name,
              Data_Type: parent.Data_Type,
              // Item_Contributors was renamed into Authors
              // // Item_Contributors: parent.Item_Contributors,
              Authors: parent.Authors,
              // Item_Attributes.Article_Version was renamed into Article_Version
              // // Item_Attributes.Article_Version: parent.Item_Attributes.Article_Version,
              Article_Version: parent.Article_Version,

              // Item_Attributes was deleted, and now is spread
              // // Item_Attributes: parent.Item_Attributes,
              // Item_Attributes.Article_Type was deleted
              // // Item_Attributes.Article_Type: parent.Item_Attributes.Article_Type,
              // Item_Attributes.Qualification_Name was deleted
              // // Item_Attributes.Qualification_Name: parent.Item_Attributes.Qualification_Name,
              // Item_Attributes.Qualification_Level was deleted
              // // Item_Attributes.Qualification_Level: parent.Item_Attributes.Qualification_Level,
              // Item_Attributes.Proprietary was deleted
              // // Item_Attributes.Proprietary: parent.Item_Attributes.Proprietary,
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
            // Item_Dates was renamed into Publication_Date
            // // Item_Dates: reportItem.Item_Dates,
            Publication_Date: reportItem.Publication_Date,
            Publisher_ID: reportItem.Publisher_ID,

            Title: reportItem.Title,
            Item: reportItem.Item,
            Database: reportItem.Database,
            Platform: reportItem.Platform,
            Publisher: reportItem.Publisher,
            // Item_Contributors was renamed into Authors
            // // Item_Contributors: reportItem.Item_Contributors,
            Authors: reportItem.Authors,

            // Item_Attributes.Article_Version was renamed into Article_Version
            // // Item_Attributes.Article_Version: reportItem.Item_Attributes.Article_Version,
            Article_Version: reportItem.Article_Version,

            // Item_Attributes was deleted, and now is spread
            // // Item_Attributes: reportItem.Item_Attributes,
            // Item_Attributes.Article_Type was deleted
            // // Item_Attributes.Article_Type: reportItem.Item_Attributes.Article_Type,
            // Item_Attributes.Qualification_Name was deleted
            // // Item_Attributes.Qualification_Name: reportItem.Item_Attributes.Qualification_Name,
            // Item_Attributes.Qualification_Level was deleted
            // // Item_Attributes.Qualification_Level: reportItem.Item_Attributes.Qualification_Level,
            // Item_Attributes.Proprietary was deleted
            // // Item_Attributes.Proprietary: reportItem.Item_Attributes.Proprietary,
            // Section_Type was deleted
            // // Section_Type: reportItem.Section_Type,
          };

          // Extract item identifiers
          const identifiers = Object.entries(baseItem.Item_ID ?? {})
            .map(([key, value]) => `${key}:${value}`)
            .sort();

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
                      // Period was deleted
                      // // Period: period,
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
