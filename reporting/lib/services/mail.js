const nodemailer = require('nodemailer');
const logger = require('../logger');
const { smtp } = require('config');

const transporter = nodemailer.createTransport(smtp);

module.exports = {
  sendMail: async (mailOptions) => {
    mailOptions = mailOptions || {};
    mailOptions.attachments = mailOptions.attachments || [];
    mailOptions.from = smtp.sender;

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) { return reject(err); }
        return resolve(info);
      });
    });
  },

  templates: (templateName, params = {}) => {
    if (!templateName) {
      return logger.error('No template name defined');
    }

    return {
      html: 'aa',
      text: 'aa',
    };
  },
};