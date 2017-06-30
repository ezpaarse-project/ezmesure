const nodemailer = require('nodemailer');
const { smtp } = require('config');

const transporter = nodemailer.createTransport(smtp);

module.exports = function sendMail (options) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) { return reject(err); }
      resolve(info);
    });
  });
};
