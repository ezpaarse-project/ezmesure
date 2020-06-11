const path = require('path');
const fs = require('fs-extra');
const nunjucks = require('nunjucks');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const { smtp } = require('config');

const templatesDir = path.resolve(__dirname, '..', '..', 'templates');
const imagesDir = path.resolve(templatesDir, 'images');
const transporter = nodemailer.createTransport(smtp);

nunjucks.configure(templatesDir);

const images = fs.readdirSync(imagesDir);

module.exports = {
  async sendMail(mailOptions) {
    const options = mailOptions || {};
    options.attachments = options.attachments || [];

    images.forEach((image) => {
      options.attachments.push({
        filename: image,
        path: path.resolve(imagesDir, image),
        cid: image,
      });
    });

    return new Promise((resolve, reject) => {
      transporter.sendMail(options, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      });
    });
  },

  /**
   * Generate a mail with a registered template
   * @param {String} templateName the template to use
   * @param {Object} locals local variables to be used in the template
   */
  generateMail(templateName, locals = {}) {
    if (!templateName) { throw new Error('No template name provided'); }

    const text = nunjucks.render(`${templateName}.txt`, locals);
    const mjmlTemplate = nunjucks.render(`${templateName}.mjml`, locals);
    const { html, errors } = mjml2html(mjmlTemplate);

    return { html, text, errors };
  },
};
