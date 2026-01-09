const path = require('node:path');

const fs = require('fs-extra');
const nunjucks = require('nunjucks');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const { smtp, publicUrl, notifications } = require('config');

/** @typedef {import('mjml-core').MJMLParseError} MJMLParseError */

const templatesDir = path.resolve(__dirname, '../../templates');
const imagesDir = path.resolve(templatesDir, 'images');
const transporter = nodemailer.createTransport(smtp);

nunjucks.configure(templatesDir);

const images = fs.readdirSync(imagesDir);

/**
 * Send mail with given options
 *
 * @param {nodemailer.SendMailOptions} mailOptions - The options of mail
 *
 * @returns {Promise<nodemailer.SentMessageInfo>}
 */
module.exports.sendMail = (mailOptions) => {
  const options = {
    sender: notifications.sender,
    replyTo: notifications.replyTo || undefined,
    attachments: [],
    ...mailOptions,
  };

  images.forEach((image) => {
    options.attachments.push({
      filename: image,
      path: path.resolve(imagesDir, image),
      cid: image,
    });
  });

  return transporter.sendMail(options);
};

/**
 * Generate a mail with a registered template
 *
 * @param {string} templateName the template to use
 * @param {Record<string, unknown>} locals local variables to be used in the template
 *
 * @returns {{ html: string, text: string, errors: MJMLParseError[] }}
 */
module.exports.generateMail = (templateName, locals = {}) => {
  if (!templateName) { throw new Error('No template name provided'); }

  const data = {
    ...locals,
    PUBLIC_URL: publicUrl,
    REPLY_TO: notifications.replyTo,
  };

  const text = nunjucks.render(`${templateName}.txt`, data);
  const mjmlTemplate = nunjucks.render(`${templateName}.mjml`, data);
  const { html, errors } = mjml2html(mjmlTemplate);

  return { html, text, errors };
};
