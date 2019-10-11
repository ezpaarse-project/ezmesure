const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const rison = require('rison-node');
const { promisify } = require('util');
const { elasticsearch, kibana } = require('config');
const logger = require('../logger');
const elastic = require('./elastic');

const fsp = { readFile: promisify(fs.readFile) };

const moment = require('moment');
moment().locale('en');

const getAssets = async () => {
  let logo, preserveLayoutCSS, printCSS;

  try {
    logo = await fsp.readFile(path.resolve('assets', 'logo.png'), 'base64');
  } catch (err) {
    logger.error(err);
  }

  try {
    preserveLayoutCSS = await fsp.readFile(path.resolve('assets', 'css', 'preserve_layout.css'), 'utf8');
  } catch (err) {
    logger.error(err);
  }

  try {
    printCSS = await fsp.readFile(path.resolve('assets', 'css', 'print.css'), 'utf8');
  } catch (err) {
    logger.error(err);
  }

  return {
    logo,
    preserveLayoutCSS,
    printCSS,
  };
}

const getDashboard = async (dashboardId, namespace) => {
  try {
    const { body: data } = await elastic.search({
      index: '.kibana',
      timeout: '30s',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  type: 'dashboard',
                },
              },
              {
                match: {
                  _id: `${namespace ? `${namespace}:` : ''}dashboard:${dashboardId}`,
                },
              },
            ],
          },
        },
      },
    });

    if (data && data.hits && data.hits.hits) {
      return data.hits.hits;
    }
  } catch (err) {
    logger.error(err);
    return [];
  }
};

const generateDashboardData = async (dashboardId, space, frequency) => {
  let _gData, _aData, dashboard;

  try {
    const dashboardData = await getDashboard(dashboardId, space);

    if (dashboardData) {
      dashboard = dashboardData[0];
      const sourceJSON = JSON.parse(dashboard._source.dashboard.kibanaSavedObjectMeta.searchSourceJSON);
      const panelsJSON = JSON.parse(dashboard._source.dashboard.panelsJSON);
      const referencesData = dashboard._source.references;

      const filters = sourceJSON.filter;

      const index = referencesData.find(ref => ref.name === filters[0].meta.indexRefName);
      filters[0].meta.index = index.id;
      delete filters[0].meta.indexRefName


      panelsJSON.forEach((panel) => {
        const reference = referencesData.find(ref => ref.name === panel.panelRefName);
        panel.type = reference.type;
        panel.id = reference.id;
  
        delete panel.panelRefName;
      });

      if (dashboard._source.dashboard.timeRestore) {
        _gData = rison.encode({
          refreshInterval: dashboard._source.dashboard.refreshInterval,
          time: {
            from: `now-${frequency}`,
            to: 'now',
          },
        });
      }

      _aData = rison.encode({
        description: dashboard._source.dashboard.description,
        filters,
        fullScreenMode: false,
        options: JSON.parse(dashboard._source.dashboard.optionsJSON),
        panels: panelsJSON,
        query: sourceJSON.query,
        timeRestore: dashboard._source.dashboard.timeRestore,
        title: dashboard._source.dashboard.title,
        viewMode: 'view',
      });
    }
  } catch (e) {
    logger.error(e);
  }

  return {
    dashboardUrl: `${space ? `s/${space}`: ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(_gData)}&_a=${encodeURIComponent(_aData)}`,
    dashboard: {
      title: dashboard._source.dashboard.title,
      description: dashboard._source.dashboard.description,
    },
  };
};

module.exports = async (dashboardId, space, frequency, print) => {
  try {
    const dashboardData = await generateDashboardData(dashboardId, space, frequency);

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
          $(visualizations[i]).width(`${viewport.a4.width}px`);
          $(visualizations[i]).height(`${(viewport.a4.height - viewport.margin.top)}px`);
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
        <p style="font-size: 10px;">Report generated on ${moment().format('dddd Do MMMM YYYY')}</p></div>`,
      footerTemplate: `<div style="width: 1920px; color: black;">
        <div style="text-align: center;">
          <a href="${kibana.external}"><img src="data:image/png;base64,${css.logo}" width="128px" /></a>
        </div>
        <div style="text-align: right; margin-right: 60px;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>
      </div>`,
    };

    if (print) {
      pdfOptions = {
        ...pdfOptions, 
        format: 'A4',
        landscape: true,
      };
    } else {
      pdfOptions = {
        ...pdfOptions, 
        width: viewport.width,
        height: (bouncingBox.height + viewport.heightPaddingTop),
      };
    }

    const pdf = await page.pdf(pdfOptions);
    
    await browser.close();

    return pdf;
  } catch (e) {
    console.error(e);
  }
};
