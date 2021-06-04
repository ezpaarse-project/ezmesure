const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const printPDF = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4000/reporting/render-bibCNRS');

  const pdf = await page.pdf({
    format: 'A4',
    preferCSSPageSize: true,
    footerTemplate: '<div id="footer-template" style="font-size:10px; width:100%; text-align:center"><p>Page <span class="pageNumber"></span>/<span class="totalPages"></span></p></div>',
    displayHeaderFooter: true,
    margin: {
      bottom: '50px',
    },
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
