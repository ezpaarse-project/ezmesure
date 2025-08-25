const jwt = require('jsonwebtoken');
const config = require('config');
const { addHours } = require('date-fns');

const UsersService = require('../../../entities/users.service');

const { appLogger } = require('../../../services/logger');

const { sendWelcomeMail } = require('../mail');
const { sendNewUserToContacts } = require('./mail');

const passwordResetValidity = config.get('passwordResetValidity');
const secret = config.get('auth.secret');

/**
 * Generates a token for the activation of the user's account.
 *
 * @param {string} origin - Host origin.
 * @param {string} username - Username of the user who needs to activate his account.
 *
 * @returns {string}
 */
exports.activateUserLink = function activateUserLink(origin, username) {
  const currentDate = new Date();
  const expiresAt = addHours(currentDate, passwordResetValidity);
  const token = jwt.sign({
    username,
    createdAt: currentDate,
    expiresAt,
  }, secret);

  return `${origin}/activate?token=${token}`;
};

exports.activateCurrentUser = async (ctx) => {
  const { user } = ctx.state;
  const { email } = user;

  if (user?.metadata?.acceptedTerms) {
    ctx.throw(409, ctx.$t('errors.user.alreadyActivated'));
    return;
  }

  const usersService = new UsersService();

  try {
    const res = await usersService.acceptTerms(user.username);
    user.metadata = res.metadata;
  } catch (err) {
    ctx.status = 500;
    appLogger.error(`Failed to update user: ${err}`);
    return;
  }

  try {
    await sendWelcomeMail(user);
  } catch (err) {
    appLogger.error(`Failed to send welcome mail to : ${err}`);
  }

  const origin = ctx.get('origin');
  const [, domain] = email.split('@');

  let correspondents;
  try {
    correspondents = await usersService.findEmailOfCorrespondentsWithDomain(domain);
  } catch (err) {
    appLogger.error(`Failed to get collaborators of new user: ${err}`);
  }

  if (Array.isArray(correspondents) && correspondents.length > 0) {
    await Promise.all(
      correspondents.map(async ({ email: userMail, memberships }) => {
        if (!userMail || memberships.length <= 0) {
          return;
        }

        try {
          await sendNewUserToContacts(userMail, {
            manageMemberLinks: memberships.map(({ institution }) => ({
              href: `${origin}/myspace/institutions/${institution.id}/members`,
              label: institution.name,
            })),
            newUser: user.username,
          });
        } catch (err) {
          appLogger.error(`Failed to send mail to ${userMail}: ${err}`);
        }
      }),
    );
  }

  ctx.body = { ...user };
  ctx.status = 200;
};
