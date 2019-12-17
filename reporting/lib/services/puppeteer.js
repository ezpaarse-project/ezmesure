const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { elasticsearch, kibana, puppeteerTimeout } = require('config');
const logger = require('../logger');
const dashboard = require('./dashboard');

const fsp = { readFile: promisify(fs.readFile) };

const moment = require('moment');

const getAssets = async () => {
  let logo, preserveLayoutCSS, printCSS;

  logo = await fsp.readFile(path.resolve('assets', 'logo.png'), 'base64');
  preserveLayoutCSS = await fsp.readFile(path.resolve('assets', 'css', 'preserve_layout.css'), 'utf8');
  printCSS = await fsp.readFile(path.resolve('assets', 'css', 'print.css'), 'utf8');

  if (logo && preserveLayoutCSS && printCSS) {
    return {
      logo,
      preserveLayoutCSS,
      printCSS,
    };
  }

  return null;
}

module.exports = async (dashboardId, space, frequency, print) => {
  const dashboardData = await dashboard.data(dashboardId, space, frequency);

  const css = await getAssets();
  
  const fields = {
    username: 'input[name=username]',
    password: 'input[name=password]',
  };
  
  const viewport = {
    width: 1920,
    a4: {
      width: 1096, // 29cm
      height: 793, // 21cm
    },
    heightPaddingTop: 100,
    margin: {
      left: 75,
      right: 75,
      top: 120,
      bottom: 75,
    }
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
  
  await page.goto(`${kibana.internal || kibana.external}/${dashboardData.dashboardUrl}`, {
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

  const bouncingBox = await dashboardViewport.boundingBox();
  const visualizations = await page.$$('.dshLayout--viewing .react-grid-item');

  await page.setViewport({
    width: print ? viewport.a4.width : viewport.width,
    height: print ? (viewport.a4.height * visualizations.length) : bouncingBox.height,
    deviceScaleFactor: 1,
  });

  await page.evaluate(({ print, css, viewport }) => {
    let cssLayout = css.preserveLayoutCSS;

    if (print) {
      cssLayout += css.printCSS;
    }

    const node = document.createElement('style');
    node.type = 'text/css';
    node.innerHTML = cssLayout;
    document.getElementsByTagName('head')[0].appendChild(node);

    if (print) {
      const visualizations = $('.dshLayout--viewing .react-grid-item').toArray();
      for (i = 0; i < visualizations.length; i += 1) {
        visualizations[i].style.top = `${(viewport.a4.height - viewport.margin.top) * i}px`;
      }
    }
  }, { print, css, viewport });

  await page.waitFor(5000);

  let pdfOptions = {
    margin: {
      left: `${viewport.margin.left}px`,
      right: `${viewport.margin.right}px`,
      top: `${viewport.margin.top}px`,
      bottom: `${viewport.margin.bottom}px`,
    },
    printBackground: false,
    displayHeaderFooter: true,
    headerTemplate: `<div style="width: 1920px; color: black; text-align: center;">
      <h1 style="font-size: 14px;"><a href="${kibana.external}/${dashboardData.dashboardUrl}">${dashboardData.dashboard.title}</a></h1>
      <p style="font-size: 12px;">${dashboardData.dashboard.description}</p>
      <p style="font-size: 10px;">Rapport généré le ${moment().locale('fr').format('dddd Do MMMM YYYY')}</p></div>`,
    footerTemplate: `<div style="width: 1920px; color: black;">
      <div style="text-align: center;">
        <a href="${kibana.external}"><img src="data:image/png;base64,${css.logo}" width="128px" /></a>
      </div>
      <div style="text-align: right; margin-right: 60px;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>`,
  };

  if (print) {
    pdfOptions.format = 'A4';
    pdfOptions.landscape = true;
  } else {
    const height = (bouncingBox.height + viewport.heightPaddingTop);
    pdfOptions.width = viewport.width;
    pdfOptions.height = Math.max(height, 600);
  }

  const pdf = await page.pdf(pdfOptions);

  return pdf || null;
};
