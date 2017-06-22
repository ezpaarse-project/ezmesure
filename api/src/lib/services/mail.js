import nodemailer from 'nodemailer';
import { smtp } from 'config';

const transporter = nodemailer.createTransport(smtp);

export default function sendMail (options) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) { return reject(err); }
      resolve(info);
    });
  });
};
