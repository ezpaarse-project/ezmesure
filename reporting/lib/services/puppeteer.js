const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');
const { EventEmitter } = require('events');
const formatDate = require('date-fns/format');
const { fr } = require('date-fns/locale');
const {
  elasticsearch,
  kibana,
  puppeteerTimeout,
  logos,
  sender,
} = require('config');
const { getDashboard, buildDashboardUrl } = require('./dashboard');
const Frequency = require('./frequency');
const logger = require('../logger');
const { sendMail, generateMail } = require('./mail');

const assetsDir = path.resolve(__dirname, '..', '..', 'assets');

function loadStyles() {
  return fs.readFile(path.resolve(assetsDir, 'css', 'preserve_layout.css'), 'utf8');
}

function loadLogos() {
  return Promise.all(
    logos.map(async (l) => {
      const logo = { ...l };

      if (logo.link === 'kibana') {
        logo.link = `${kibana.external}/`;
      }
      if (logo.file) {
        logo.base64 = await fs.readFile(path.resolve(assetsDir, logo.file), 'base64');
      }

      return logo;
    }),
  );
}

function insertStyles(page, css) {
  return page.evaluate((styles) => {
    const styleNode = document.createElement('style'); // eslint-disable-line no-undef
    styleNode.type = 'text/css';
    styleNode.innerHTML = styles;
    document.head.appendChild(styleNode); // eslint-disable-line no-undef
  }, css);
}

function positionElements(page, viewport) {
  return page.evaluate((vp) => {
    // eslint-disable-next-line no-undef
    const visualizations = document.querySelectorAll('.dshLayout--viewing .react-grid-item');
    const pageHeight = vp.height - vp.margin.top - vp.margin.bottom;

    if (visualizations && visualizations.length) {
      const grid = document.querySelector('.dshLayout--viewing');
      grid.style.height = `${pageHeight * (visualizations.length - 1)}px`;
    }

    visualizations.forEach((visualization, index) => {
      visualization.style.setProperty('top', `${(pageHeight) * index}px`, 'important');
    });
  }, viewport);
}

function waitForCompleteRender(page) {
  page.evaluate(() => {
    const allVis = document.querySelectorAll('[data-shared-item]'); // eslint-disable-line no-undef
    const renderedTasks = [];

    function waitForRender(visualization) {
      return new Promise((resolve) => {
        visualization.addEventListener('renderComplete', () => { resolve(); });
      });
    }

    function waitForRenderDelay() {
      // Time to wait for visualizations that are not evented (official ones are all evented)
      return new Promise((resolve) => setTimeout(resolve, 3000));
    }

    allVis.forEach((visualization) => {
      const isRendered = visualization.getAttribute('data-render-complete');

      if (isRendered === 'disabled') {
        renderedTasks.push(waitForRenderDelay());
      } else if (isRendered === 'false') {
        renderedTasks.push(waitForRender(visualization));
      }
    });

    return Promise.all(renderedTasks);
  });
}

class Reporter {
  constructor() {
    this.browser = null;
    this.busy = false;
    this.tasks = [];
  }

  /**
   * Launch a browser if there's no instance yet
   */
  async launchBrowser() {
    if (this.browser) { return; }

    this.browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: true,
      slowMo: 10,
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--no-zygote',
        '--disable-setuid-sandbox', // Absolute trust of the open content in chromium
        '--disable-dev-shm-usage',
      ],
    });
  }

  /**
   * Close the current browser
   */
  async closeBrowser() {
    if (this.browser) {
      // const pages = await this.browser.pages();
      // await Promise.all(pages.map((page) => page.close()));
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Create a new page, launch browser if needed
   */
  async newPage() {
    const page = await this.browser.newPage();
    page.setDefaultNavigationTimeout(puppeteerTimeout);
    page.setDefaultTimeout(puppeteerTimeout);

    return page;
  }

  async testPuppeteer () {
    try {
      await this.launchBrowser();
      await this.closeBrowser();
      logger.info('Puppeteer : ready');
    } catch (error) {
      logger.error('Puppeteer : can\'t get started');
      logger.error(error);
      console.error(error);

      await sendMail({
        from: sender,
        to: sender,
        subject: `Reporting - erreur test puppeteer`,
        ...generateMail('error', {
          message: 'Une erreur est survenue pendant le test de puppeteer.',
          error: error,
        }),
      });
    }
  }

  addTask(task = {}) {
    const frequency = new Frequency(task.frequency);

    if (!frequency.isValid()) {
      throw new Error('invalid task frequency');
    }

    const emitter = new EventEmitter();
    this.tasks.push([task, emitter]);
    this.performTasks();

    return emitter;
  }

  async performTasks() {
    if (this.busy) { return; }
    this.busy = true;

    try {
      await this.launchBrowser();
    } catch (e) {
      logger.error('Failed to launch browser');
      logger.error(e);
      this.busy = false;
      this.tasks.forEach(([, emitter]) => emitter.emit('error', e));
      return;
    }

    while (this.tasks.length > 0) {
      const [task, emitter] = this.tasks.shift();
      let page;

      emitter.emit('start');

      try {
        page = await this.newPage(); // eslint-disable-line no-await-in-loop
        const pdf = await Reporter.generatePDF(page, task); // eslint-disable-line no-await-in-loop
        emitter.emit('complete', pdf);
      } catch (e) {
        emitter.emit('error', e);
      }

      try {
        if (page) {
          await page.close(); // eslint-disable-line no-await-in-loop
        }
      } catch (e) {
        logger.error('Failed to close page');
        logger.error(e);
      }
    }

    try {
      await this.closeBrowser();
    } catch (e) {
      logger.error('Failed to close browser');
      logger.error(e);
    }

    this.busy = false;
  }

  static async generatePDF(page, task) {
    const {
      dashboardId,
      space,
      frequency: frequencyString,
      print,
    } = task;

    const frequency = new Frequency(frequencyString);

    if (!frequency.isValid()) {
      throw new Error('invalid task frequency');
    }

    const now = new Date();
    const period = {
      from: frequency.startOfPreviousPeriod(now),
      to: frequency.startOfCurrentPeriod(now),
    };

    const { dashboard } = (await getDashboard(dashboardId, space)) || {};
    const dashboardUrl = buildDashboardUrl(dashboardId, space, period);
    const dashboardTitle = dashboard && dashboard.title;

    await page.goto(`${kibana.internal || kibana.external}/${dashboardUrl}`, {
      waitUntil: 'load',
    });

    // Wait for either login form or dashboard wrapper
    await page.waitFor('.login-form, .dshLayout--viewing');

    const loginForm = await page.$('.login-form');
    if (loginForm) {
      await page.type('input[name=username]', elasticsearch.username);
      await page.type('input[name=password]', elasticsearch.password);
      await page.keyboard.press('Enter');
      await page.waitFor('.dshLayout--viewing');
    }

    const dashboardViewport = await page.$('.dshLayout--viewing');
    const boundingBox = await dashboardViewport.boundingBox();

    // 792x1122 = A4 at 96PPI
    const viewport = {
      width: 1122,
      height: print ? 792 : boundingBox.height,
      margin: {
        left: 50,
        right: 50,
        top: 100,
        bottom: 60,
      },
    };

    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
    });

    let styles = await loadStyles();

    styles += `
      #dashboardChrome {
        display: none;
        height: 0;
        width: 0;
      }
      body {
        padding: 0 !important;
        min-width: ${viewport.width}px !important;
        width: ${viewport.width}px !important;
      }
    `;

    if (print) {
      styles += `
        body {
          min-width: ${viewport.width - viewport.margin.right - viewport.margin.left}px !important;
          width: ${viewport.width - viewport.margin.right - viewport.margin.left}px !important;
        }
        dashboard-app .react-grid-item {
          position: fixed !important;
          left: 0 !important;
          background-color: inherit !important;
          z-index: 1 !important;
          width: ${viewport.width - viewport.margin.right - viewport.margin.left}px !important;
          height: ${viewport.height - viewport.margin.top - viewport.margin.bottom}px !important;
          transform: none !important;
          -webkit-transform: none !important;
          box-shadow: none;
          -webkit-box-shadow: none;
        }
      `;
    }

    await insertStyles(page, styles);
    if (print) {
      await positionElements(page, viewport);
    }
    await waitForCompleteRender(page);

    dashboardViewport.dispose();

    await page.waitFor(5000);

    const logoHtml = (await loadLogos()).map((logo) => `
      <a href="${logo.link}">
        <img src="data:image/png;base64,${logo.base64}" style="max-height: 20px; margin-right: 5px; vertical-align: middle;" />
      </a>
    `);

    const pdfOptions = {
      margin: {
        left: `${viewport.margin.left}px`,
        right: `${viewport.margin.right}px`,
        top: `${viewport.margin.top}px`,
        bottom: `${viewport.margin.bottom}px`,
      },
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate: `
        <style>#header, #footer { padding: 10px !important; }</style>
        <div style="width: ${viewport.width}px; color: black; text-align: center; line-height: 5px">
          <h1 style="font-size: 14px;"><a href="${kibana.external}/${dashboardUrl}">${dashboardTitle}</a></h1>
          <p style="font-size: 10px;">
            Rapport couvrant la période
            du ${formatDate(period.from, 'Pp', { locale: fr })}
            au ${formatDate(period.to, 'Pp', { locale: fr })}
          </p>
          <p style="font-size: 10px;">Généré le ${formatDate(new Date(), 'PPPP', { locale: fr })}</p>
        </div>
      `,
      footerTemplate: `
        <div style="width: ${viewport.width}px; color: black; position: relative;">
          ${logoHtml}
          <div style="position: absolute; right: 0; bottom: 0; font-size: 8px;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>
      `,
    };

    if (print) {
      pdfOptions.width = viewport.width;
      pdfOptions.height = viewport.height;
    } else {
      const height = (boundingBox.height + viewport.margin.top + viewport.margin.bottom);
      pdfOptions.width = viewport.width;
      pdfOptions.height = Math.max(height, 600);
    }

    return page.pdf(pdfOptions);
  }
}

module.exports = new Reporter();
