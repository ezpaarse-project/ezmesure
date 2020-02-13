const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
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

const fsp = { readFile: promisify(fs.readFile) };

const assetsDir = path.resolve(__dirname, '..', '..', 'assets');

function loadStyles() {
  return fsp.readFile(path.resolve(assetsDir, 'css', 'preserve_layout.css'), 'utf8');
}

function loadLogos() {
  return Promise.all(
    logos.map(async (l) => {
      const logo = { ...l };

      if (logo.link === 'kibana') {
        logo.link = `${kibana.external}/`;
      }
      if (logo.file) {
        logo.base64 = await fsp.readFile(path.resolve(assetsDir, logo.file), 'base64');
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

module.exports = async (dashboardId, space, frequencyString, print) => {
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

  const fields = {
    username: 'input[name=username]',
    password: 'input[name=password]',
  };

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: true,
    slowMo: 10,
    ignoreDefaultArgs: ['--enable-automation'],
    defaultViewport: null,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', // Absolute trust of the open content in chromium
    ],
  });
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(puppeteerTimeout);
  page.setDefaultTimeout(puppeteerTimeout);

  await page.goto(`${kibana.internal || kibana.external}/${dashboardUrl}`, {
    waitUntil: 'load',
  });

  await page.waitFor('form');

  await page.waitFor(fields.username);
  await page.type(fields.username, elasticsearch.username);

  await page.waitFor(fields.password);
  await page.type(fields.password, elasticsearch.password);

  await page.keyboard.press('Enter');

  await page.waitFor('.dshLayout--viewing');

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

  if (print) {
    styles += `
      dashboard-app .react-grid-item {
        position: fixed;
        left: 0 !important;
        background-color: inherit !important;
        z-index: 1 !important;
        width: ${viewport.width - viewport.margin.right - viewport.margin.left}px !important;
        height: ${viewport.height - viewport.margin.top - viewport.margin.bottom}px !important;
        transform: none !important;
        -webkit-transform: none !important;
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

  const pdf = await page.pdf(pdfOptions);

  await browser.close();

  return pdf || null;
};
