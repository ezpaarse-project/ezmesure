const formatDate = require('date-fns/format');
const { fr } = require('date-fns/locale');

const {
  index,
  historyIndex,
  kibana,
  sender,
  email,
  frequencies,
} = require('config');
const logger = require('../logger');
const elastic = require('./elastic');
const { getDashboard } = require('./dashboard');
const Frequency = require('./frequency');
const puppeteer = require('./puppeteer');
const { sendMail, generateMail } = require('./mail');

async function getTasks() {
  const res = await elastic.search({
    index,
    body: {
      query: {
        range: {
          runAt: {
            lte: new Date(),
          },
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

/**
 * Run a task : generate a PDF and send it by mail
 * @param {Object} task the task to run
 */
async function generateReport(task) {
  const { _id: taskId, _source: taskSource } = task;

  logger.info(`Starting reporting task ${taskId}`);
  const hrstart = process.hrtime.bigint();

  const history = {
    taskId,
    executionTime: 0,
    data: [],
  };

  let dashboard;
  logger.info(`${taskId} : getting dashboard (id: ${taskSource.space || 'default'}:${taskSource.dashboardId})`);
  try {
    // eslint-disable-next-line no-await-in-loop
    dashboard = await getDashboard(taskSource.dashboardId, taskSource.space);
  } catch (e) {
    history.data.push({
      status: 'error',
      message: `${taskId} : dashboard (id: ${taskSource.space || 'default'}:${taskSource.dashboardId}) not found or removed`,
      date: new Date(),
    });
    logger.error(`${taskId} : dashboard (id: ${taskSource.space || 'default'}:${taskSource.dashboardId}) not found or removed`);
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

  logger.info(`${taskId} : generating pdf (id: ${taskSource.space || 'default'}:${taskSource.dashboardId})`);

  let pdf;
  try {
    // eslint-disable-next-line no-await-in-loop
    pdf = await puppeteer(
      taskSource.dashboardId,
      taskSource.space || null,
      taskSource.frequency,
      taskSource.print,
    );
  } catch (e) {
    history.data.push({
      status: 'error',
      message: 'Error during PDF report generation',
      date: new Date(),
    });
    logger.error(`${taskId} : error during PDF report generation (id: ${taskSource.space || 'default'}:${taskSource.dashboardId})`);
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

  logger.info(`${taskId} : sending mail`);

  const dashboardUrl = `${kibana.external}/${taskSource.space ? `s/${taskSource.space}/` : ''}app/kibana#/dashboard/${taskSource.dashboardId}`;
  const dashboardTitle = (dashboard && dashboard.dashboard && dashboard.dashboard.title) || '';

  const frequency = frequencies.find((f) => f.value === taskSource.frequency);
  const frequencyText = (frequency && frequency.fr && frequency.fr.toLowerCase()) || 'N/A';

  const now = new Date();
  let emailSent = false;

  for (let i = 0; i < email.attempts; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendMail({
        from: sender,
        to: taskSource.emails,
        subject: `Reporting ezMESURE [${taskSource.print ? 'OI - ' : ''}${formatDate(now, 'dd/MM/yyyy')}] - ${dashboardTitle}`,
        attachments: [
          {
            contentType: 'application/pdf',
            filename: `reporting_ezMESURE_${taskSource.dashboardId}_${formatDate(now, 'dd-MM-yyyy')}.pdf`,
            content: pdf,
            cid: task.dashboardId,
          },
        ],
        ...generateMail('reporting', {
          reportingDate: formatDate(now, 'PPPP', { locale: fr }),
          title: dashboardTitle,
          frequency: frequencyText,
          dashboardUrl,
          optimizedForPrinting: taskSource.print ? ' optimisé pour impression' : '',
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

  const sentAt = new Date();
  const freq = new Frequency(taskSource.frequency);

  if (!freq.isValid()) {
    history.data.push({
      status: 'error',
      message: 'Task frequency is invalid, cannot schedule next run',
      date: new Date(),
    });
    logger.error(`${taskId} : task frequency is invalid, cannot schedule next run`);
  }

  try {
    // eslint-disable-next-line no-await-in-loop
    await elastic.update({
      index,
      id: taskId,
      body: {
        doc: {
          ...taskSource,
          sentAt,
          runAt: freq.isValid() ? freq.startOfnextPeriod(sentAt) : null,
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
  }
}

async function generatePendingReports() {
  logger.info('Looking for pending tasks');
  let tasks;

  try {
    tasks = await getTasks();
  } catch (e) {
    logger.error('Cannot fetch tasks');
    return;
  }

  logger.info(`${tasks.length} pending tasks found`);

  for (let i = 0; i < tasks.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await generateReport(tasks[i]);
  }
}

module.exports = {
  generateReport,
  generatePendingReports,
};
