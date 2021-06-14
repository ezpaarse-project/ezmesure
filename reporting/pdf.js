const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const formatDate = require('date-fns/format');
const { fr } = require('date-fns/locale');
const { Command } = require('commander');
const {
  sendMail,
  generateMail,
} = require('./lib/services/mail');

const printPDF = async () => {
  const browser = await puppeteer.launch({
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

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/reporting/render-bibCNRS');

  const pdf = await page.pdf({
    format: 'A4',
    preferCSSPageSize: true,
    footerTemplate: '<div id="footer-template" style="font-size:10px; width:100%; text-align:center"><p>Page <span class="pageNumber"></span>/<span class="totalPages"></span></p></div>',
    displayHeaderFooter: true,
    margin: {
      bottom: '50px',
    },
  });

  const program = new Command();

  program.version('0.0.1');
  program.option('-m, --mail <string>', 'specifying to which mail you want to send the report');

  program.parse(process.argv);

  const options = program.opts();
  const { mail } = options;

  console.log(mail);

  await sendMail({
    from: 'reporting@vega.fr',
    to: mail || 'a@a.fr, b@b.fr',
    subject: 'Reporting ezMESURE',
    attachments: [{
      contentType: 'application/pdf',
      filename: 'reporting.pdf',
      content: pdf,
      cid: '1d168869-b93d-4163-aeec-4f7fdb0eb44f',
    }],
    ...generateMail('reporting', {
      reportingDate: formatDate(new Date(), 'PPPP', { local: fr }),
      title: 'Reporting Vega',
      frequency: 'Hebdomadaire',
      dashboardUrl: 'https://google.fr',
      optimizedForPrinting: false,
    }),
  });

  try {
    await fs.writeFile(path.resolve(__dirname, 'monPDF.pdf'), pdf);
    console.log("Le fichier monPDF.pdf s'est bien généré.");
  } catch (e) {
    console.log(e);
  }
  // const ws = fs.createWriteStream(path.resolve(__dirname, 'monPDF.pdf'));
  // ws.write(pdf);
  // ws.close();

  await browser.close();
};

printPDF();
