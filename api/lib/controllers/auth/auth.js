const jwt = require('jsonwebtoken');
const config = require('config');
const { addHours, isBefore, parseISO } = require('date-fns');
const elastic = require('../../services/elastic');

const usersElastic = require('../../services/elastic/users');
const ezrUsers = require('../../services/ezreeport/users');

const UsersService = require('../../entities/users.service');
const MembershipsService = require('../../entities/memberships.service');
const ElasticRoleService = require('../../entities/elastic-roles.service');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { appLogger } = require('../../services/logger');
const { sendPasswordRecovery, sendWelcomeMail, sendNewUserToContacts } = require('./mail');

const { schema: membershipSchema, includableFields: includableMembershipFields } = require('../../entities/memberships.dto');
const { schema: elasticRoleSchema, includableFields: includableElasticRoleFields } = require('../../entities/elastic-roles.dto');

const secret = config.get('auth.secret');
const cookie = config.get('auth.cookie');

const resetPasswordSecret = `${secret}_password_reset`;

const standardMembershipsQueryParams = prepareStandardQueryParams({
  schema: membershipSchema,
  includableFields: includableMembershipFields,
  queryFields: [],
});
exports.standardMembershipsQueryParams = standardMembershipsQueryParams;

const standardElasticRolesQueryParams = prepareStandardQueryParams({
  schema: elasticRoleSchema,
  includableFields: includableElasticRoleFields,
  queryFields: [],
});
exports.standardElasticRolesQueryParams = standardElasticRolesQueryParams;

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

exports.getReportingToken = async (ctx) => {
  const token = await ezrUsers.getToken(ctx?.state?.user?.username);
  ctx.body = { token };
};

exports.renaterLogin = async (ctx) => {
  const { query } = ctx.request;
  const headers = ctx.request.header;

  const email = decode(headers.mail);
  const idp = headers['shib-identity-provider'];

  if (!idp) {
    ctx.throw(400, ctx.$t('errors.auth.IDPNotFound'));
    return;
  }

  if (!email) {
    ctx.throw(400, ctx.$t('errors.auth.noEmailInHeaders'));
    return;
  }

  const userProps = {
    username: email.split('@')[0].toLowerCase(),
    fullName: decode(headers.displayname || headers.cn || headers.givenname),
    email,
    metadata: {
      idp,
      uid: headers.uid,
      org: decode(headers.o),
      unit: decode(headers.ou),
      eppn: headers.eppn,
      remoteUser: headers.remote_user,
      persistentId: headers['persistent-id'] || headers['targeted-id'],
      affiliation: headers.affiliation,
    },
  };

  const { username } = userProps;

  const usersService = new UsersService();

  let user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.action = 'user/register';
    ctx.metadata = { username };

    userProps.metadata.acceptedTerms = false;

    // First create the user
    user = await usersService.create({ data: userProps });

    try {
      await sendWelcomeMail(user);
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  } else if (query.refresh) {
    ctx.action = 'user/refresh';
    ctx.metadata = { username };

    userProps.metadata.acceptedTerms = !!user.metadata.acceptedTerms;

    try {
      await usersService.update({
        where: { username },
        data: userProps,
      });
      appLogger.info(`User [${user.username}] is updated`);
    } catch (err) {
      appLogger.error(`User [${user.username}] cannot be updated: ${err.message}`);
      ctx.throw(500, err);
      return;
    }
  } else {
    ctx.action = 'user/connection';
    ctx.metadata = { username };
  }

  const token = generateToken(user);
  ctx.cookies.set(cookie, token, { httpOnly: true });
  ctx.body = { token };
  ctx.redirect(decodeURIComponent(ctx.query.origin || '/'));
};

exports.elasticLogin = async (ctx) => {
  ctx.action = 'user/connection';

  const { username, password } = ctx.request.body;
  const basicString = Buffer.from(`${username}:${password}`).toString('base64');
  let user;

  try {
    const response = await elastic.security.authenticate({}, {
      headers: {
        authorization: `Basic ${basicString}`,
      },
    });
    user = response && response.body;
  } catch (e) {
    ctx.throw(e.statusCode || 500, e.message);
    return;
  }

  if (!user) {
    ctx.throw(401);
    return;
  }

  // eslint-disable-next-line no-underscore-dangle
  if (user.metadata && user.metadata._reserved) {
    ctx.throw(403, ctx.$t('errors.auth.reservedUser'));
    return;
  }

  const usersService = new UsersService();

  user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.throw(401);
  }

  const token = generateToken(user);
  ctx.metadata = { username };
  ctx.cookies.set(cookie, token, { httpOnly: true });
  ctx.body = { ...user, token };
  ctx.status = 200;
};

exports.activate = async (ctx) => {
  const { body } = ctx.request;
  const { password } = body;

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

  const userElastic = await usersElastic.getUserByUsername(user.username);

  if (!userElastic) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  await usersElastic.updatePassword(user.username, password);

  await sendWelcomeMail(user);

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

  const token = generateToken(user);
  ctx.metadata = { username: user.username };
  ctx.cookies.set(cookie, token, { httpOnly: true });
  ctx.body = { ...user, token };
  ctx.status = 200;
};

exports.getResetToken = async (ctx) => {
  const { body } = ctx.request;

  const username = body.username || ctx.state.user.username;

  const user = await usersElastic.getUserByUsername(username);

  if (!user) {
    ctx.throw(404, ctx.$t('errors.auth.noUserFound'));
    return;
  }

  const origin = ctx.get('origin');

  const currentDate = new Date();
  const expiresAt = addHours(currentDate, config.passwordResetValidity);
  const token = jwt.sign({
    username: user.username,
    createdAt: currentDate,
    expiresAt,
  }, resetPasswordSecret);

  const diffInHours = config.get('passwordResetValidity');
  await sendPasswordRecovery(user, {
    recoveryLink: `${origin}/password/new?token=${token}`,
    resetLink: `${origin}/password/reset`,
    validity: `${diffInHours} heure${diffInHours > 1 ? 's' : ''}`,
  });

  ctx.status = 204;
};

exports.resetPassword = async (ctx) => {
  const { password, token } = ctx.request.body;

  const { valid, data } = await new Promise((resolve) => {
    jwt.verify(token, resetPasswordSecret, (err, decoded) => {
      resolve({ valid: !err, data: decoded });
    });
  });

  if (!valid || !data?.username || !data?.createdAt) {
    ctx.throw(400, ctx.$t('errors.password.invalidToken'));
    return;
  }

  const { username, createdAt } = data;

  const usersService = new UsersService();
  const user = await usersService.findUnique({ where: { username } });
  if (!user) {
    ctx.throw(404, ctx.$t('errors.auth.noUserFound'));
    return;
  }

  user.metadata = user.metadata || {};

  if (user.metadata.passwordDate) {
    const tokenIsValid = isBefore(parseISO(user.metadata.passwordDate), parseISO(createdAt));

    if (!tokenIsValid) {
      ctx.throw(400, ctx.$t('errors.password.expires'));
      return;
    }
  }

  user.metadata.passwordDate = new Date();

  try {
    await usersService.update({
      where: { username },
      data: user,
    });
  } catch (err) {
    ctx.throw(500, ctx.$t('errors.auth.noUserFound'));
    return;
  }

  await usersElastic.updatePassword(username, password);

  ctx.status = 204;
};

exports.changePassword = async (ctx) => {
  const { body } = ctx.request;
  const { actualPassword, password } = body;

  const { username } = ctx.state.user;

  // Check if actualPassword is correct
  const basicString = Buffer.from(`${username}:${actualPassword}`).toString('base64');
  let esUser;

  try {
    const response = await elastic.security.authenticate({}, {
      headers: {
        authorization: `Basic ${basicString}`,
      },
    });
    esUser = response && response.body;
  } catch (e) {
    ctx.throw(e.statusCode || 500, e.message);
    return;
  }

  if (!esUser) {
    ctx.throw(401);
    return;
  }

  // eslint-disable-next-line no-underscore-dangle
  if (esUser.metadata && esUser.metadata._reserved) {
    ctx.throw(403, ctx.$t('errors.auth.reservedUser'));
    return;
  }

  // Update password

  await usersElastic.updatePassword(username, password);

  ctx.status = 204;
};

exports.getUser = async (ctx) => {
  const usersService = new UsersService();
  const user = await usersService.findUnique({
    where: { username: ctx.state.user.username },
  });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getToken = async (ctx) => {
  ctx.status = 200;
  ctx.body = generateToken(ctx.state.user);
};

exports.getMemberships = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardMembershipsQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.username = username;

  ctx.status = 200;
  const membershipsService = new MembershipsService();
  ctx.body = await membershipsService.findMany(prismaQuery);
};

exports.getElasticRoles = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardElasticRolesQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.users = { some: { username } };

  ctx.status = 200;
  const elasticRolesService = new ElasticRoleService();
  ctx.body = await elasticRolesService.findMany(prismaQuery);
};

exports.logout = async (ctx) => {
  ctx.cookies.set(cookie, null, { httpOnly: true });
  ctx.redirect(decodeURIComponent('/myspace'));
};
