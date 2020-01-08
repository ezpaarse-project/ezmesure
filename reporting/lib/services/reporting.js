const moment = require('moment');
const {
  index,
  historyIndex,
  kibana,
  sender,
  email,
} = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const { getDashboard } = require('./dashboard');
const puppeteer = require('./puppeteer');
const { sendMail, generateMail } = require('./mail');

async function getTasks(frequency) {
  const res = elastic.search({
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

  return (res && res.body && res.body.hits && res.body.hits.hits) || [];
}

async function storeHistory(history, taskId, hrstart) {
  const hrend = process.hrtime.bigint();

  logger.info(`Ending reporting task ${taskId} in ${history.executionTime}ms`);

  return elastic.index({
    index: historyIndex,
    body: {
      ...history,
      createdAt: new Date(),
      executionTime: Math.floor(Number.parseInt(hrend - hrstart, 10) / 1e6),
    },
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async function generateReports(frequency, tasks) {
  let reportingTasks = tasks;
  if (!tasks) {
    try {
      reportingTasks = await getTasks(frequency);
    } catch (e) {
      logger.error(`${frequency.text} : cannot fetch tasks`);
      return;
    }
  }

  for (let j = 0; j < reportingTasks.length; j += 1) {
    const task = reportingTasks[j];
    const { _id: taskId, _source: source } = task;

    logger.info(`Starting reporting task ${taskId}`);
    const hrstart = process.hrtime.bigint();

    const history = {
      taskId,
      executionTime: 0,
      data: [],
    };

    let dashboard;
    logger.info(`${taskId} : getting dashboard (id: ${source.space || 'default'}:${source.dashboardId})`);
    try {
      // eslint-disable-next-line no-await-in-loop
      dashboard = await getDashboard(source.dashboardId, source.space);
    } catch (e) {
      history.data.push({
        status: 'error',
        message: `${taskId} : dashboard (id: ${source.space || 'default'}:${source.dashboardId}) not found or removed`,
        date: new Date(),
      });
      logger.error(`${taskId} : dashboard (id: ${source.space || 'default'}:${source.dashboardId}) not found or removed`);
      logger.error(e);

      try {
        // eslint-disable-next-line no-await-in-loop
        await storeHistory(history, taskId, hrstart);
        return;
      } catch (err) {
        logger.error(`${taskId} : error during data insertion in index (${historyIndex})`);
        logger.error(err);
        return;
      }
    }

    logger.info(`${taskId} : generating pdf (id: ${source.space || 'default'}:${source.dashboardId})`);

    let pdf;
    try {
      // eslint-disable-next-line no-await-in-loop
      pdf = await puppeteer(
        source.dashboardId,
        source.space || null,
        source.frequency,
        source.print,
      );
    } catch (e) {
      history.data.push({
        status: 'error',
        message: 'Error during PDF report generation',
        date: new Date(),
      });
      logger.error(`${taskId} : error during PDF report generation (id: ${source.space || 'default'}:${source.dashboardId})`);
      logger.error(e);

      try {
        // eslint-disable-next-line no-await-in-loop
        await storeHistory(history, taskId, hrstart);
        return;
      } catch (err) {
        logger.error(`${taskId} : error during data insertion in index (${historyIndex})`);
        logger.error(err);
        return;
      }
    }

    const dashboardUrl = `${kibana.external}/${source.space ? `s/${source.space}/` : ''}app/kibana#/dashboard/${source.dashboardId}`;

    let emailSent = false;
    logger.info(`${taskId} : sending mail`);

    const { _source: dashboardSource } = dashboard;
    const dashboardTitle = (dashboardSource && dashboardSource.dashboard && dashboardSource.dashboard.title) || '';

    for (let i = 0; i < email.attempts; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await sendMail({
          from: sender,
          to: source.emails,
          subject: `Reporting ezMESURE [${source.print ? 'OI - ' : ''}${moment().format('DD/MM/YYYY')}] - ${dashboardTitle}`,
          attachments: [
            {
              contentType: 'application/pdf',
              filename: `reporting_ezMESURE_${source.dashboardId}_${moment().format('DD-MM-YYYY')}.pdf`,
              content: pdf,
              cid: task.dashboardId,
            },
          ],
          ...generateMail('reporting', {
            reportingDate: moment().locale('fr').format('dddd Do MMMM YYYY'),
            title: dashboardTitle,
            frequency: frequency.fr.toLowerCase(),
            dashboardUrl,
            optimizedForPrinting: source.print ? ' optimisé pour impression' : '',
          }),
        });
        emailSent = true;
        logger.info(`${taskId} : email sent`);
        break;
      } catch (e) {
        logger.error(`${taskId} : error when generating or sending emails (attempts: ${(i + 1)})`);
        logger.error(e);

        // eslint-disable-next-line no-await-in-loop
        await wait(email.interval * (i + 1));
      }
    }

    if (!emailSent) {
      history.data.push({
        status: 'error',
        message: 'Error when generating or sending emails',
        date: new Date(),
      });
    }

    const currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    source.sentAt = currentDate;

    try {
      // eslint-disable-next-line no-await-in-loop
      await elastic.update({
        index,
        id: taskId,
        body: {
          doc: {
            ...source,
          },
        },
      });
    } catch (e) {
      history.data.push({
        status: 'error',
        message: 'Error during data insertion in index',
        date: new Date(),
      });
      logger.error(`${taskId} : error during data insertion in index (${index})`);
      logger.error(e);
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      await storeHistory(history, taskId, hrstart);
    } catch (e) {
      logger.error(`Error during data insertion in index ${historyIndex} (taskId: ${taskId})`);
      logger.error(e);
      return;
    }
  }
};
