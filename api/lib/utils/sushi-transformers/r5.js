// @ts-check

const {
  format,
  isSameMonth,
  isLastDayOfMonth,
  isFirstDayOfMonth,
} = require('date-fns');

/**
 * Transform a list of attributes into an object
 *
 * @param {Array<Object>} list an array of { Type, Value } or { Name, Value } objects
 * @param {Object} opts
 * @param {string} [opts.splitValuesBy] the string used to split the values
 *
 * @returns an object representation of the list where each type becomes a property
 *          if a type appears multiple times, the value of the resulting property is an array
 */
function list2object(list, opts = {}) {
  const obj = {};
  const { splitValuesBy } = opts;

  if (!Array.isArray(list)) { return obj; }

  list.forEach((el) => {
    const elementKey = el?.Type || el?.Name;
    let elementValue = el?.Value;

    if (!elementKey || !elementValue) { return; }

    const valuesSoFar = obj[elementKey];

    if (splitValuesBy && typeof elementValue === 'string') {
      elementValue = elementValue.split(splitValuesBy);
    }

    if (valuesSoFar) {
      obj[elementKey] = [].concat(valuesSoFar).concat(elementValue);
    } else {
      obj[elementKey] = elementValue;
    }
  });

  return obj;
}

module.exports = function prepareC5Transformer(report) {
  // Extract report header
  const reportHeader = {
    Created: report?.Report_Header?.Created,
    Created_By: report?.Report_Header?.Created_By,
    Customer_ID: report?.Report_Header?.Customer_ID,
    Report_ID: report?.Report_Header?.Report_ID,
    Release: report?.Report_Header?.Release,
    Report_Name: report?.Report_Header?.Report_Name,
    Institution_Name: report?.Report_Header?.Institution_Name,

    Institution_ID: list2object(report?.Report_Header?.Institution_ID),
    Report_Filters: list2object(report?.Report_Header?.Report_Filters),
    Report_Attributes: list2object(report?.Report_Header?.Report_Attributes, { splitValuesBy: '|' }),
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
        const item = {
          Report_Header: reportHeader,

          Item_ID: list2object(reportItem.Item_ID),
          Item_Dates: list2object(reportItem.Item_Dates),
          Item_Attributes: list2object(reportItem.Item_Attributes),
          Publisher_ID: list2object(reportItem.Publisher_ID),

          Title: reportItem.Title,
          Item: reportItem.Item,
          Database: reportItem.Database,
          Platform: reportItem.Platform,
          Publisher: reportItem.Publisher,
          Data_Type: reportItem.Data_Type,
          YOP: reportItem.YOP,
          Section_Type: reportItem.Section_Type,
          Access_Type: reportItem.Access_Type,
          Access_Method: reportItem.Access_Method,
          Item_Contributors: reportItem.Item_Contributors,
        };

        // Extract item parent
        const itemParent = reportItem.Item_Parent;
        if (itemParent) {
          item.Item_Parent = {
            Item_ID: list2object(itemParent.Item_ID),
            Item_Dates: list2object(itemParent.Item_Dates),
            Item_Attributes: list2object(itemParent.Item_Attributes),

            Item_Name: itemParent.Item_Name,
            Data_Type: itemParent.Data_Type,
            Item_Contributors: itemParent.Item_Contributors,
          };
        }

        // Extract item identifiers
        const identifiers = Object.entries(item.Item_ID)
          .map(([key, value]) => `${key}:${value}`)
          .sort();

        // eslint-disable-next-line no-restricted-syntax
        for (const performance of reportItem.Performance) {
          if (!Array.isArray(performance?.Instance)) { return; }

          const period = performance.Period;
          const perfBeginDate = new Date(period.Begin_Date);
          const perfEndDate = new Date(period.End_Date);

          if (!isSameMonth(perfBeginDate, perfEndDate)) {
            yield {
              error: `Item #${i} performance cover more than a month`
                    + ` [${perfBeginDate} -> ${perfEndDate}]`
                    + ` [ID: ${identifiers.join(', ')}]`
                    + ` [Title: ${item.Title}]`,
              date: undefined,
              metric: undefined,
            };
            // eslint-disable-next-line no-continue
            continue;
          }
          if (!isFirstDayOfMonth(perfBeginDate) || !isLastDayOfMonth(perfEndDate)) {
            yield {
              error: `Item #${i} performance does not cover the entire month`
                    + ` [${perfBeginDate} -> ${perfEndDate}]`
                    + ` [ID: ${identifiers.join(', ')}]`
                    + ` [Title: ${item.Title}]`,
              date: undefined,
              metric: undefined,
            };
            // eslint-disable-next-line no-continue
            continue;
          }

          const date = format(perfBeginDate, 'yyyy-MM');
          yield {
            error: '',
            date,
            metric: undefined,
          };

          // eslint-disable-next-line no-restricted-syntax
          for (const instance of performance.Instance) {
            // eslint-disable-next-line no-continue
            if (typeof instance?.Metric_Type !== 'string') { continue; }

            yield {
              error: '',
              date,
              metric: {
                index: i,
                metricType: instance.Metric_Type,
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
                  Metric_Type: instance.Metric_Type,
                  Count: instance.Count,
                  Period: period,
                },
              },
            };
          }
        }
      }
    },
  };
};
