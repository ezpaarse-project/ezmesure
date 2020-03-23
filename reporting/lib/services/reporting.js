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
const reporter = require('./puppeteer');
const { sendMail, generateMail } = require('./mail');

async function getTasks() {
  const res = await elastic.search({
    index,
    size: 10000,
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class HistoryEntry {
  constructor(taskId) {
    this.id = null;
    this.startTime = null;
    this.endTime = null;

    this.history = {
      taskId,
      executionTime: 0,
      status: 'pending',
      logs: [],
      startTime: new Date(),
      endTime: null,
    };
  }

  setStatus(str) {
    this.history.status = str;
    return this;
  }

  log(type, message) {
    this.history.logs.push({ date: new Date(), type, message });

    if (typeof logger[type] === 'function') {
      logger[type](`${this.history.taskId}: ${message}`);
    }
    return this;
  }

  startTimer() {
    this.startTime = process.hrtime.bigint();
  }

  end() {
    const endTime = process.hrtime.bigint();
    this.startTime = this.startTime || endTime;
    this.history.endTime = new Date();
    this.history.executionTime = Math.floor(Number.parseInt(endTime - this.startTime, 10) / 1e6);

    if (this.history.status !== 'error') {
      this.history.status = 'completed';
    }

    this.log('info', `task terminated in ${this.history.executionTime}ms`);
    return this;
  }

  async save() {
    try {
      const result = await elastic.index({
        id: this.id,
        index: historyIndex,
        body: this.history,
      });

      if (!this.id) {
        const { body = {} } = result || {};
        const { _id: newID } = body;
        this.id = newID;
      }
    } catch (e) {
      this.log('error', `failed to create or update history entry in index (${historyIndex})`);
      logger.error(e);
    }
  }
}

/**
 * Run a task : generate a PDF and send it by mail
 * @param {Object} task the task to run
 */
async function generateReport(task) {
  const { _id: taskId, _source: taskSource } = task;

  const history = new HistoryEntry(taskId);
  const fullDashboardId = `${taskSource.space || 'default'}:${taskSource.dashboardId}`;
  let dashboard;

  history.log('info', `fetching dashboard data (id: ${fullDashboardId})`);

  // eslint-disable-next-line no-await-in-loop
  await history.save();

  try {
    // eslint-disable-next-line no-await-in-loop
    dashboard = await getDashboard(taskSource.dashboardId, taskSource.space);
  } catch (e) {
    history.setStatus('error');
    history.log('error', `dashboard (id: ${fullDashboardId}) not found or removed`);
    logger.error(e);

    // eslint-disable-next-line no-await-in-loop
    await history.end().save();
    return;
  }

  history.log('info', 'adding task to queue');
  await history.save();

  let pdf;
  try {
    // eslint-disable-next-line no-await-in-loop
    pdf = await new Promise((resolve, reject) => {
      reporter.addTask(taskSource)
        .on('start', () => {
          history.startTimer();
          history.setStatus('ongoing');
          history.log('info', 'task has been started');
          history.save();
        })
        .on('complete', resolve)
        .on('error', reject);
    });
  } catch (e) {
    history.setStatus('error');
    history.log('error', 'failed to generate PDF');
    logger.error(e);

    // eslint-disable-next-line no-await-in-loop
    await history.end().save();
    return;
  }

  logger.info(`${taskId} : sending mail`);

  const dashboardUrl = `${kibana.external}/${taskSource.space ? `s/${taskSource.space}/` : ''}app/kibana#/dashboard/${taskSource.dashboardId}`;
  const dashboardTitle = (dashboard && dashboard.dashboard && dashboard.dashboard.title) || '';

  const frequency = frequencies.find((f) => f.value === taskSource.frequency);
  const frequencyText = (frequency && frequency.fr && frequency.fr.toLowerCase()) || 'N/A';

  const now = new Date();
  let emailSent = false;
  let receivers = taskSource.emails;

  if (!Array.isArray(taskSource.emails)) {
    receivers = [receivers];
  }

  for (let i = 0; i < email.attempts; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendMail({
        from: sender,
        to: receivers.join(','),
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
      history.log('info', 'the email was sent');
      break;
    } catch (e) {
      history.log('warn', `failed to send email (attempts: ${(i + 1)})`);
      logger.error(e);

      // eslint-disable-next-line no-await-in-loop
      await wait(email.interval * (i + 1));
    }
  }

  if (!emailSent) {
    history.setStatus('error');
    history.log('error', 'error when generating or sending emails');
  }

  const sentAt = new Date();
  const freq = new Frequency(taskSource.frequency);

  if (!freq.isValid()) {
    history.setStatus('error');
    history.log('error', 'task frequency is invalid, cannot schedule next run');
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
    history.setStatus('error');
    history.log('error', `Failed to update task data in index (${index})`);
    logger.error(e);
  }

  // eslint-disable-next-line no-await-in-loop
  await history.end().save();
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

  tasks.forEach((task) => {
    generateReport(task)
      .catch((e) => {
        logger.error(`${task.id}: failed to generate report`);
        logger.error(e);
      });
  });
}

module.exports = {
  generateReport,
  generatePendingReports,
};
