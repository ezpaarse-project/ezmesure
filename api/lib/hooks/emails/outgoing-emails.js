// @ts-check
const { registerHook } = require('../hookEmitter');
const { appLogger } = require('../../services/logger');

const OutgoingEmailsService = require('../../entities/outgoing-emails.service');

/**
 * @typedef {import('nodemailer').SendMailOptions} SendMailOptions
 * @typedef {import('nodemailer/lib/smtp-pool').SentMessageInfo} SentMessageInfo
 *
 * @typedef {object} EmailSentHookPayload
 * @prop {SendMailOptions} options - The options of the mail
 * @prop {SentMessageInfo} [result] - The result, if the sendMail() function succeeded
 * @prop {Error | null} [error] - The error, if the sendMail() function failed
 * @prop {import('../../services/mail').SendMailMeta} [meta] - Email metadata
 */

/**
 * @param {EmailSentHookPayload} payload
 */
const onEmailSent = async (payload) => {
  appLogger.verbose('[emails][hooks] Saving outgoing email');

  const {
    options,
    result,
    error,
    meta,
  } = payload ?? {};

  // If everything went fine, the normalized recipient list is in the envelope
  let recipients = result?.envelope?.to;

  if (!Array.isArray(recipients) && options?.to) {
    // If the envelope is not available, get the recipients from the mail options
    const to = Array.isArray(options.to) ? options.to : [options.to];

    recipients = to.map((recipient) => {
      if (typeof recipient === 'string') {
        return recipient;
      }
      return recipient?.address;
    });
  }

  const errors = [];

  if (error) {
    errors.push(error.message);
  }

  if (Array.isArray(result?.rejectedErrors) && result.rejectedErrors.length > 0) {
    errors.push(...result.rejectedErrors.map((e) => e.message));
  }

  try {
    await (new OutgoingEmailsService()).create({
      data: {
        recipients,
        subject: options?.subject,
        status: error ? 'failed' : 'sent',
        template: meta?.templateName,
        locale: meta?.locale,
        errors,
      },
    });
  } catch (err) {
    appLogger.error(`[emails][hooks] Failed to save outgoing email: ${err}`);
  }
};

registerHook('email:sent', onEmailSent, { queue: 'outgoing-emails' });
