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
} = require('config');
const { getDashboard, buildDashboardUrl } = require('./dashboard');
const Frequency = require('./frequency');
const logger = require('../logger');

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
      landscape = true,
      format = 'A4',
    } = task;

    // Dimensions in mm
    const formats = {
      'A5': { width: 148, height: 210 },
      'A4': { width: 210, height: 297 },
      'A3': { width: 297, height: 420 },
      'A2': { width: 420, height: 594 },
    }

    const reportSize = formats[format];
    const frequency = new Frequency(frequencyString);

    if (!reportSize) {
      throw new Error(`invalid report size, should be one of : ${Object.keys(formats).join(', ')}`);
    }

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

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    const pageWidth = landscape ? reportSize.height : reportSize.width;
    const pageHeight = landscape ? reportSize.width : reportSize.height;
    const headerHeight = 25;
    const footerHeight = 10;

    await page.addStyleTag({
      content: `
        :root {
          --page-width: ${pageWidth}mm;
          --page-height: ${pageHeight}mm;
          --header-height: ${headerHeight}mm;
          --footer-height: ${footerHeight}mm;
        }
      `
    });
    await page.addStyleTag({
      path: path.resolve(assetsDir, 'css', 'preserve_layout.css')
    });
    await page.addStyleTag({
      path: path.resolve(assetsDir, 'css', 'reporting.css')
    });

    const headerTemplate = `
      <h1 class="reporting-header-title">
        <a href="${kibana.external}/${dashboardUrl}">${dashboardTitle}</a>
      </h1>
      <p class="reporting-header-subtitle">
        Rapport couvrant la période
        du ${formatDate(period.from, 'Pp', { locale: fr })}
        au ${formatDate(period.to, 'Pp', { locale: fr })}
      </p>
      <p class="reporting-header-caption">
        Généré le ${formatDate(new Date(), 'PPPP', { locale: fr })}
      </p>
    `;

    const logoHtml = (await loadLogos()).map((logo) => `
      <a href="${logo.link}">
        <img class="footer-logo" src="data:image/png;base64,${logo.base64}" />
      </a>
    `);

    const footerTemplate = `
      <div class="footer-logos">
        ${logoHtml.join('\n')}
      </div>
      <div class="footer-page"></div>
    `;

    await page.evaluate((hTemplate, fTemplate, optimized) => {
      if (optimized) {
        const visualizations = document.querySelectorAll('.dshLayout--viewing .react-grid-item');

        visualizations.forEach((visualization, index) => {
          visualization.classList.add('reporting-optimized');

          const header = document.createElement('div');
          header.className = 'reporting-header';
          header.innerHTML = hTemplate;

          const footer = document.createElement('div');
          footer.className = 'reporting-footer';
          footer.innerHTML = fTemplate;

          footer.querySelector('.footer-page').textContent = `${index + 1} / ${visualizations.length}`;

          visualization.parentNode.insertBefore(header, visualization);
          visualization.parentNode.insertBefore(footer, visualization.nextSibling);
        });
      } else {
        const wrapper = document.getElementById('dashboardViewport');

        const header = document.createElement('div');
        header.className = 'reporting-header';
        header.innerHTML = hTemplate;

        const footer = document.createElement('div');
        footer.className = 'reporting-footer';
        footer.innerHTML = fTemplate;

        wrapper.prepend(header);
        wrapper.append(footer);
      }
    }, headerTemplate, footerTemplate, print);

    await waitForCompleteRender(page);
    await page.waitFor(2000);

    const pdfOptions = {
      margin: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        // left: `${viewport.margin.left}mm`,
        // right: `${viewport.margin.right}mm`,
        // top: `${viewport.margin.top}mm`,
        // bottom: `${viewport.margin.bottom}mm`,
      },
      printBackground: false,
      displayHeaderFooter: false
    };

    if (print) {
      pdfOptions.width = `${pageWidth}mm`;
      pdfOptions.height = `${pageHeight}mm`;
    } else {
      pdfOptions.width = `${pageWidth}mm`;
      pdfOptions.height = await page.evaluate(() => document.documentElement.scrollHeight);
    }

    return page.pdf(pdfOptions);
  }
}

module.exports = new Reporter();
