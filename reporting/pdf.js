const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');


const PATHS = {
  win32: {
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: 'C:\\Users\\<USERNAME>\\AppData\\Local\\Temp\\puppeteer_user_data',
  },
  linux: {
    executablePath: '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    userDataDir: '/mnt/c/Users/<USERNAME>/AppData/Local/Temp/puppeteer_user_data',
  },
};

const printPDF = async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: PATHS[process.platform].executablePath,
      userDataDir: PATHS.win32.userDataDir,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:4000/reporting/render-bibCNRS');

    const pdf = await page.pdf({
      format: 'A4',
    });

    const ws = fs.createWriteStream(path.resolve(__dirname, 'monPDF.pdf'));
    ws.write(pdf);
    ws.close();

    await browser.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

printPDF();
