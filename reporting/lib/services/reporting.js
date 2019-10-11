const { index } = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const puppeteer = require('./puppeteer');
const moment = require('moment');
const { sendMail, templates } = require('./mail');

module.exports = async () => {
  try {
    const rows = await elastic.search({
      index,
      timeout: '30s',
    });

    if (rows) {
      const tasks = rows.body.hits.hits;

      for(let i = 0; i < tasks.length; i += 1) {
        const task = tasks[i]._source;

        const currentDate = moment().format();

        const pdf = await puppeteer(task.dashboardId, task.space || null, task.frequency, task.print);

        await sendMail({
          to: task.emails,
          subject: 'Reporting ezMESURE',
          ...templates('report', null),
          attachments: [
            {
              contentType: 'application/pdf',
              filename: `reporting_ezMESURE_${task.dashboardId}_${currentDate}.pdf`,
              content: pdf,
              cid: task.dashboardId,
            }
          ]
        });
      }
    } 
  } catch (e) { logger.error(e); }
};