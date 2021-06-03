const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const printPDF = async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4000/reporting/render-bibCNRS');

  const pdf = await page.pdf({
    height: '800px',
    width: '28cm',
    preferCSSPageSize: true,
  });

  const ws = fs.createWriteStream(path.resolve(__dirname, 'monPDF.pdf'));
  ws.write(pdf);
  ws.close();

  await browser.close();
};

printPDF();
