const path = require('path');
const nunjucks = require('nunjucks');
const nodemailer = require('nodemailer');
const { smtp } = require('config');

const templatesDir = path.resolve(__dirname, '..', '..', 'templates');
const transporter = nodemailer.createTransport(smtp);

nunjucks.configure(templatesDir);

module.exports = {
  sendMail (options) {
    return new Promise((resolve, reject) => {
      transporter.sendMail(options, (err, info) => {
        if (err) { return reject(err); }
        resolve(info);
      });
    });
  },

  /**
   * Generate a mail with a registered template
   * @param {String} templateName the template to use
   * @param {Object} locals local variables to be used in the template
   */
  generateMail (templateName, locals = {}) {
    if (!templateName) { throw new Error('No template name provided'); }

    return {
      html: nunjucks.render(`${templateName}.html`, locals),
      text: nunjucks.render(`${templateName}.txt`, locals)
    };
  }
};
