const moment = require('moment');
const { index, kibana, sender } = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const { getDashboard } = require('./dashboard');
const puppeteer = require('./puppeteer');
const { frequencies } = require('config');
const { sendMail, generateMail } = require('./mail');
const fs = require('fs');
const path = require('path');

module.exports = async (frequency) => {
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
                  frequency: frequency.value,
                },
              },
              {
                range: {
                  sentAt: {
                    lte: `now-${frequency.value}/${(frequency.value.substr(frequency.value.length - 1))}`,
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
        logger.info(`Starting reporting task : ${task._id}`);

        const dashboard = await getDashboard(source.dashboardId, source.space);

        if (!dashboard) {
          logger.warn(`Dashboard not found or removed (id: ${source.dashboardId}) : #${task._id}`);
        }

        if (dashboard) {
          const pdf = await puppeteer(source.dashboardId, source.space || null, source.frequency, source.print);

          if (pdf) {
            let currentDate = new Date();

            const pdfName = `${task._id}_auto_${currentDate.getTime()}.pdf`;
            logger.info(`Saving pdf file : tmp/${pdfName}`);
            fs.writeFile(path.resolve('tmp', pdfName), pdf, err => {
              if(err) logger.error('PDF saving failed !');
            });

            const shortenUrl = `${kibana.external}/${source.space ? `s/${source.space}/`: ''}app/kibana#/dashboard/${source.dashboardId}`;

            logger.info(`Sending mail : ${task._id}`);

            await sendMail({
              from: sender,
              to: source.emails,
              subject: `Reporting ezMESURE [${source.print ? 'OI - ' : ''}${moment().format('DD/MM/YYYY')}] - ${dashboard._source.dashboard.title}`,
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
                frequency: frequency.fr.toLowerCase(),
                shortenUrl,
                optimizedForPrinting: source.print ? ' optimisé pour impression' : '',
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
        }
      } catch (e) {
        logger.error(`Error on task : ${task._id}`);
        logger.error(e);
      }
    }
  }
};