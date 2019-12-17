const moment = require('moment');
const { index, historyIndex, kibana, sender, email } = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const { getDashboard } = require('./dashboard');
const puppeteer = require('./puppeteer');
const { sendMail, generateMail } = require('./mail');
const fs = require('fs-extra');
const path = require('path');

const getTasks = async (frequency) => {
  try {
    let tasks = await elastic.search({
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

    if (tasks && tasks.body && tasks.body.hits && tasks.body.hits.hits) {
      return tasks.body.hits.hits;
    }
  } catch (e) {
    return logger.error(`${frequency.text} : cannot fetch tasks`);
  }
};

module.exports = async (frequency, tasks) => {
  let reportingTasks = tasks;
  if (!tasks) {
    try {
      reportingTasks = await getTasks(frequency);
    } catch (e) {
      return logger.error(`${frequency.text} : cannot fetch tasks`);
    }
  }

  for (let j = 0; j < reportingTasks.length; j += 1) {
    const task = reportingTasks[j];

    logger.info(`Starting reporting task ${task._id}`);
    const hrstart = process.hrtime.bigint();

    const source = task._source;

    const history = {
      taskId: task._id,
      executionTime: 0,
      data: [],
    };

    let dashboard;
    logger.info(`${task._id} : getting dashboard (id: ${source.space || 'default'}:${source.dashboardId})`);
    try {
      dashboard = await getDashboard(source.dashboardId, source.space);
    } catch (e) {
      history.data.push({
        status: 'error',
        message: `${task._id} : dashboard (id: ${source.space || 'default'}:${source.dashboardId}) not found or removed`,
        date: new Date(),
      });
      logger.error(`${task._id} : dashboard (id: ${source.space || 'default'}:${source.dashboardId}) not found or removed`);
      logger.error(e);

      try {
        return storeHistory(history, task._id, hrstart);
      } catch (e) {
        logger.error(`${task._id} : error during data insertion in index (${historyIndex})`);
        return logger.error(e);
      }
    }

    let pdf;
    logger.info(`${task._id} : generating pdf (id: ${source.space || 'default'}:${source.dashboardId})`);
    try {
      pdf = await puppeteer(source.dashboardId, source.space || null, source.frequency, source.print);
    } catch (e) {
      history.data.push({
        status: 'error',
        message: 'Error during PDF report generation',
        date: new Date(),
      });
      logger.error(`${task._id} : error during PDF report generation (id: ${source.space || 'default'}:${source.dashboardId})`);
      logger.error(e);

      try {
        return storeHistory(history, task._id, hrstart);
      } catch (e) {
        logger.error(`${task._id} : error during data insertion in index (${historyIndex})`);
        return logger.error(e);
      }
    }

    const dashboardUrl = `${kibana.external}/${source.space ? `s/${source.space}/`: ''}app/kibana#/dashboard/${source.dashboardId}`;

    let emailSent = false;
    logger.info(`${task._id} : sending mail`);
    for (let i = 0; i < email.attempts; i += 1) {
      try {
        await sendMail({
          from: sender,
          to: source.emails,
          subject: `Reporting ezMESURE [${source.print ? 'OI - ' : ''}${moment().format('DD/MM/YYYY')}] - ${dashboard._source.dashboard.title}`,
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
            title: dashboard._source.dashboard.title || '',
            frequency: frequency.fr.toLowerCase(),
            dashboardUrl,
            optimizedForPrinting: source.print ? ' optimisé pour impression' : '',
          }),
        });
        emailSent = true;
        logger.info(`${task._id} : email sent`);
        break;
      } catch (e) {
        logger.error(`${task._id} : error when generating or sending emails (attempts: ${(i + 1)})`);
        logger.error(e);

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

    let currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    source.sentAt = currentDate;

    try {
      await elastic.update({
        index,
        id: task._id,
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
      logger.error(`${task._id} : error during data insertion in index (${index})`);
      logger.error(e);
    }

    try {
      await storeHistory(history, task._id, hrstart);
    } catch (e) {
      logger.error(`Error during data insertion in index ${historyIndex} (taskId: ${task._id})`);
      return logger.error(e);
    }
  }
};

const storeHistory = async (history, taskId, hrstart) => {
  history.createdAt = new Date();

  const hrend = process.hrtime.bigint();
  history.executionTime = Math.floor(Number.parseInt(hrend - hrstart, 10) / 1e6);

  logger.info(`Ending reporting task ${taskId} in ${history.executionTime}ms`);

  return elastic.index({
    index: historyIndex,
    body: history,
  });
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
