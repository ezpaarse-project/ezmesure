const path = require('node:path');

const fs = require('fs-extra');
const nunjucks = require('nunjucks');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const { camelCase } = require('lodash');
const { smtp, publicUrl, notifications } = require('config');

const i18n = require('./i18n');
const { triggerHooks } = require('../hooks/hookEmitter');

const metaKey = Symbol('meta');

/** @typedef {import('mjml-core').MJMLParseError} MJMLParseError */
/** @typedef {nodemailer.SendMailOptions} SendMailOptions */

const templatesDir = path.resolve(__dirname, '../../templates');
const imagesDir = path.resolve(templatesDir, 'images');
const transporter = nodemailer.createTransport(smtp);

nunjucks.configure(templatesDir);

const images = fs.readdirSync(imagesDir);

/**
 * @typedef {object} SendMailMeta
 * @property {string} templateName - The name of the template used
 * @property {string} locale - The locale used
 */

/**
 * @typedef {object} GenerateMailOptions
 * @property {string | null} [locale] - The locale to use for translations
 * @property {string | null} [subjectKey] - The key to use for the subject. Defaults to "subject".
 */

/**
 * @typedef {object} GenerateMailReturn
 * @property {string} subject - The mail subject
 * @property {string} html - The mail body in HTML
 * @property {string} text - The mail body in text
 * @property {MJMLParseError[]} errors - The errors found while parsing the MJML template
 * @property {SendMailMeta} meta - Email metadata
 */

/**
 * Send mail with given options
 *
 * @param {SendMailOptions & { [metaKey]?: string }} sendMailOptions - The options of mail
 *
 * @returns {Promise<nodemailer.SentMessageInfo>}
 */
module.exports.sendMail = async (sendMailOptions) => {
  const {
    [metaKey]: meta = {},
    ...mailOptions
  } = sendMailOptions;

  const options = {
    from: notifications.sender,
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

  let result;

  try {
    result = await transporter.sendMail(options);
  } catch (error) {
    triggerHooks('email:sent', { options, error, meta });
    throw error;
  }

  triggerHooks('email:sent', { options, result, meta });

  return result;
};

/**
 * Generate a mail with a registered template
 *
 * @param {string} templateName the template to use
 * @param {Record<string, unknown>} [locals] local variables to be used in the template
 * @param {GenerateMailOptions} [opts] options
 *
 * @returns {GenerateMailReturn}
 */
module.exports.generateMail = (templateName, locals = {}, opts = {}) => {
  if (!templateName) { throw new Error('No template name provided'); }

  const t = i18n.t(opts.locale);
  const { format: d, formatDuration } = i18n.dateFormatter(opts.locale);

  const data = {
    ...locals,
    PUBLIC_URL: publicUrl,
    REPLY_TO: notifications.replyTo,
    t,
    d,
    formatDuration,
  };

  const subject = t(`emails.${camelCase(templateName)}.${opts?.subjectKey ?? 'subject'}`, data);
  const text = nunjucks.render(`${templateName}.txt`, data);
  const mjmlTemplate = nunjucks.render(`${templateName}.mjml`, data);
  const { html, errors } = mjml2html(mjmlTemplate);

  return {
    [metaKey]: {
      templateName,
      locale: opts.locale,
    },
    subject,
    html,
    text,
    errors,
  };
};
