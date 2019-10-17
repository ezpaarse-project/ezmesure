const moment = require('moment');
const { index, kibana } = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const { getDashboard } = require('./dashboard');
const puppeteer = require('./puppeteer');
const { frequencies } = require('config');
const { sendMail, generateMail } = require('./mail');

module.exports = async () => {
  for (let i = 0; i < frequencies.length; i += 1) {
    let tasks;
    try {
      tasks = await elastic.search({
        index,
        body: {
          query: {
            bool: {
              filter: [
                {
                  term: {
                    frequency: frequencies[i].value,
                  },
                },
                {
                  range: {
                    sentAt: {
                      lte: `now-${frequencies[i].value}`,
                    },
                  },
                },
              ],
            },
          },
        },
      });
    } catch (e) {
      logger.error(`Cannot fetch tasks`);
    }

    if (tasks && tasks.body && tasks.body.hits && tasks.body.hits.hits) {
      const reportingTasks = tasks.body.hits.hits;
      for (let j = 0; j < reportingTasks.length; j += 1) {
        const task = reportingTasks[j];

        const source = task._source;

        try {
          const pdf = await puppeteer(source.dashboardId, source.space || null, source.frequency, source.print);

          if (pdf) {
            let currentDate = new Date();

            const dashboard = await getDashboard(source.dashboardId, source.space);

            const shortenUrl = `${kibana.external}/${source.space ? `s/${source.space}`: ''}app/kibana#/dashboard/${source.dashboardId}`;

            await sendMail({
              to: source.emails,
              subject: 'Reporting ezMESURE',
              attachments: [
                {
                  contentType: 'application/pdf',
                  filename: `reporting_ezMESURE_${source.dashboardId}_${currentDate.toISOString()}.pdf`,
                  content: pdf,
                  cid: task.dashboardId,
                },
              ],
              ...generateMail('reporting', {
                reportingDate: moment().locale('fr').format('dddd Do MMMM YYYY'),
                title: dashboard._source.dashboard.title || '',
                frequency: frequencies[i].fr.toLowerCase(),
                shortenUrl,
              }),
            });

            currentDate.setHours(12, 0, 0, 0);

            source.sentAt = currentDate;

            await elastic.update({
              index,
              id: task._id,
              body: {
                doc: {
                  ...source,
                },
              },
            });
          }
        } catch (e) {
          logger.error(`Error on task : ${task._id}`);
          logger.error(e);
        }
      }
    }
  }
};