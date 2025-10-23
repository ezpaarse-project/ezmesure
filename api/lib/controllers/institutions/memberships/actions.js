const config = require('config');

const { sendMail, generateMail } = require('../../../services/mail');
const { appLogger } = require('../../../services/logger');
const { prepareStandardQueryParams } = require('../../../services/std-query');
const { client: prisma } = require('../../../services/prisma');

const UsersService = require('../../../entities/users.service');
const MembershipsService = require('../../../entities/memberships.service');
const InstitutionsService = require('../../../entities/institutions.service');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('@prisma/client').Prisma.UserSelect} UserSelect
 */
/* eslint-enable max-len */

const {
  includableFields,
  schema,
  adminUpsertSchema,
  upsertSchema,
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
} = require('../../../entities/memberships.dto');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username'],
});
exports.standardQueryParams = standardQueryParams;

function sendNewContact(receiver, institutionName) {
  const data = {
    contactBlogLink: 'https://blog.ezpaarse.org/2022/02/correspondants-ezmesure-votre-nouveau-role/',
    institution: institutionName,
  };

  return sendMail({
    from: sender,
    to: receiver,
    cc: supportRecipients,
    subject: `Vous êtes correspondant de ${institutionName}`,
    ...generateMail('new-contact', { data }),
  });
}

exports.getInstitutionMembers = async (ctx) => {
  /** @type {MembershipFindManyArgs} */
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutionId = ctx.state.institution.id;

  // Hide emails if not admin and institution is an onboarding one (if user is requested)
  if (!ctx.state.user.isAdmin && prismaQuery.include?.user && ctx.state.institution.onboarding) {
    prismaQuery.include.user = {
      select: {
        // Select everything by default
        ...Object.fromEntries(
          Object.keys(prisma.user.fields).map((key) => [key, true]),
        ),
        // Add requested (sub) includes
        ...(typeof prismaQuery.include.user === 'object' ? prismaQuery.include.user.include : {}),
        // Remove email
        email: false,
      },
    };
  }

  const membershipsService = new MembershipsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await membershipsService.count({ where: prismaQuery.where }));
  ctx.body = await membershipsService.findMany(prismaQuery);
};

exports.getInstitutionMember = async (ctx) => {
  const { institutionId, username } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(
    ctx,
    { username_institutionId: { institutionId, username } },
  );

  // Hide emails if not admin and institution is an onboarding one (if user is requested)
  if (!ctx.state.user.isAdmin && prismaQuery.include?.user && ctx.state.institution.onboarding) {
    prismaQuery.include.user = {
      select: {
        // Select everything by default
        ...Object.fromEntries(
          Object.keys(prisma.user.fields).map((key) => [key, true]),
        ),
        // Add requested (sub) includes
        ...(typeof prismaQuery.include.user === 'object' ? prismaQuery.include.user.include : {}),
        // Remove email
        email: false,
      },
    };
  }

  const membershipsService = new MembershipsService();
  const membership = await membershipsService.findUnique(prismaQuery);
  if (!membership) {
    ctx.throw(404, ctx.$t('errors.member.notFound'));
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = membership;
};

exports.addInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/addMember';

  const {
    institution,
    user: connectedUser,
  } = ctx.state;
  const { username } = ctx.params;
  const {
    id: institutionId,
    name: institutionName,
  } = institution;

  const membershipSchema = connectedUser?.isAdmin ? adminUpsertSchema : upsertSchema;
  const { value: body } = membershipSchema.validate({
    ...ctx.request.body,
    institutionId,
    username,
  });

  ctx.metadata = {
    institutionId,
    institutionName,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    include: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const { roles } = body;
  const membership = user.memberships?.[0];
  const memberIsContact = membership?.roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);
  const memberBecomesContact = roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  const membershipData = {
    permissions: ['institution:read'],
    ...body,
    user: { connect: { username } },
    institution: { connect: { id: institutionId } },
  };

  const newMembership = await membershipsService.upsert({
    where: {
      username_institutionId: { username, institutionId },
    },
    include: {
      repositoryPermissions: true,
      spacePermissions: true,
      user: true,
    },
    create: membershipData,
    update: membershipData,
  });
  appLogger.info(`Membership between user [${username}] and institution [${institutionId}] is upserted`);

  if (user.email && !memberIsContact && memberBecomesContact) {
    try {
      await sendNewContact(user.email, institutionName);
    } catch (err) {
      appLogger.error(`Failed to send new contact mail: ${err}`);
    }
  }

  ctx.status = 200;
  ctx.body = newMembership;
};

exports.removeInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/removeMember';

  const { institution, user: connectedUser } = ctx.state;
  const { username } = ctx.params;
  const { id: institutionId } = institution;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    select: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const membership = user.memberships?.[0];

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  if (!membership) {
    ctx.status = 200;
    ctx.body = { message: ctx.$t('nothingToDo') };
    return;
  }

  try {
    await membershipsService.delete({
      where: {
        username_institutionId: { username, institutionId },
      },
    });
  } catch (e) {
    ctx.throw(500, ctx.$t('errors.user.failedToUpdateRoles'));
  }

  ctx.status = 200;
  ctx.body = { message: ctx.$t('userUpdated') };
};

exports.requestMembership = async (ctx) => {
  ctx.action = 'institutions/requestMembership';

  const institutionsService = new InstitutionsService();

  const members = await institutionsService.getContacts(ctx.state.institution.id);
  const emails = members.map((member) => member.user.email);
  const linkInstitution = `${ctx.get('origin')}/myspace/institutions/${ctx.state.institution.id}/members`;

  await sendMail({
    from: sender,
    to: emails || supportRecipients,
    cc: supportRecipients,
    subject: 'Un utilisateur souhaite rejoindre votre établissement',
    ...generateMail('request-membership', {
      user: ctx.state.user.username,
      institution: ctx.state.institution.name,
      linkInstitution,
    }),
  });

  ctx.type = 'json';
  ctx.status = 204;
};
