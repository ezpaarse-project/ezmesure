const config = require('config');
const institutionsService = require('../../entities/institutions.service');
const institutionsDto = require('../../entities/institutions.dto');
const membershipService = require('../../entities/memberships.service');
const usersService = require('../../entities/users.service');

const imagesService = require('../../services/images');
const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');
const sushiCredentialsService = require('../../entities/sushi-credentials.service');
const membershipsService = require('../../entities/memberships.service');
const repositoriesService = require('../../entities/repositories.service');

const {
  PERMISSIONS,
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
  upsertSchema: membershipUpsertSchema,
  adminUpsertSchema: membershipAdminUpsertSchema,
} = require('../../entities/memberships.dto');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

const adminFields = new Set(institutionsDto.adminFields);

function sendValidateInstitution(receivers, data) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supportRecipients,
    subject: 'Votre établissement a été validé',
    ...generateMail('validate-institution', data),
  });
}

function sendNewContact(receiver) {
  const data = {
    contactBlogLink: 'https://blog.ezpaarse.org/2022/02/correspondants-ezmesure-votre-nouveau-role/',
  };

  return sendMail({
    from: sender,
    to: receiver,
    cc: supportRecipients,
    subject: 'Vous êtes correspondant de votre établissement',
    ...generateMail('new-contact', { data }),
  });
}

exports.getInstitutions = async (ctx) => {
  const {
    include: propsToInclude,
  } = ctx.query;

  let include;

  if (ctx.state?.user?.isAdmin && Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  const institution = await institutionsService.findMany({
    include,
  });

  ctx.type = 'json';
  ctx.body = institution;
};

exports.getInstitution = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = ctx.state.institution;
};

exports.createInstitution = async (ctx) => {
  ctx.action = 'institutions/create';
  const { user } = ctx.state;
  const { body } = ctx.request;
  const { addAsMember } = ctx.query;
  const { username, isAdmin } = user;
  let memberships;

  ctx.metadata = {
    institutionName: body?.name,
  };

  const base64logo = body?.logo;
  const schema = institutionsDto[isAdmin ? 'adminCreateSchema' : 'createSchema'];
  const { error, value: institutionData } = schema.validate(body);

  if (error) { ctx.throw(error); }

  if (!isAdmin || addAsMember !== false) {
    memberships = {
      create: [{
        username,
        permissions: [...PERMISSIONS],
        roles: [DOC_CONTACT, TECH_CONTACT],
        locked: true,
      }],
    };
  }

  if (base64logo) {
    institutionData.logoId = await imagesService.storeLogo(base64logo);
  }

  const institution = await institutionsService.create({
    data: { ...institutionData, memberships },
  });
  appLogger.verbose(`Institution [${institution.id}] is created`);

  ctx.metadata.institutionId = institution.id;
  ctx.status = 201;
  ctx.body = institution;
};

exports.updateInstitution = async (ctx) => {
  ctx.action = 'institutions/update';
  const { user, institution } = ctx.state;
  const { body } = ctx.request;

  const origin = ctx.get('origin');

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
  };

  if (!body) {
    ctx.throw(400, ctx.$t('errors.emptyBody'));
    return;
  }

  const schema = institutionsDto[user.isAdmin ? 'adminUpdateSchema' : 'updateSchema'];
  const { error, value: institutionData } = schema.validate(body);

  if (error) { ctx.throw(error); }

  const wasValidated = institution.validated;
  const oldLogoId = institution.logoId;
  const wasSushiReady = institution.sushiReadySince;

  if (institutionData.logo) {
    institutionData.logoId = await imagesService.storeLogo(institutionData.logo);
  }

  // FIXME: handle admin restricted fields
  const updatedInstitution = await institutionsService.update({
    where: { id: institution.id },
    data: {
      ...institutionData,
      logo: undefined,
    },
  });
  appLogger.verbose(`Institution [${institution.id}] is updated`);

  if (institutionData.logo && oldLogoId) {
    await imagesService.remove(oldLogoId);
  }

  if (!wasValidated && institutionData.validated === true) {
    const contactMemberships = await membershipService.findMany({
      where: {
        institutionId: ctx.state.institution.id,
        roles: {
          hasSome: [DOC_CONTACT, TECH_CONTACT],
        },
      },
      include: { user: true },
    });

    const contacts = contactMemberships?.map?.((m) => m.user.email);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitution(contacts, {
          manageMemberLink: `${origin}/institutions/self/memberships`,
          manageSushiLink: `${origin}/institutions/self/sushi`,
        });
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  const { sushiReadySince } = updatedInstitution;
  const sushiReadyChanged = (wasSushiReady && sushiReadySince === null)
                         || (!wasSushiReady && sushiReadySince);

  if (sushiReadyChanged) {
    sendMail({
      from: sender,
      to: supportRecipients,
      subject: sushiReadySince ? 'Fin de saisie SUSHI' : 'Reprise de saisie SUSHI',
      ...generateMail('sushi-ready-change', {
        institutionName: institution.name,
        institutionSushiLink: `${origin}/institutions/${institution.id}/sushi`,
        sushiReadySince,
      }),
    }).catch((err) => {
      appLogger.error(`Failed to send sushi-ready-change mail: ${err}`);
    });
  }

  ctx.status = 200;
  ctx.body = updatedInstitution;
};

exports.deleteInstitution = async (ctx) => {
  ctx.action = 'institutions/delete';
  const { institutionId } = ctx.params;

  const { institution } = ctx.state;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const data = await institutionsService.delete({ where: { id: institutionId } });
  appLogger.verbose(`Institution [${institution.id}] is deleted`);

  ctx.status = 200;
  ctx.body = data;
};

exports.getInstitutionRepositories = async (ctx) => {
  const { include: propsToInclude } = ctx.query;
  let include;

  if (Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  const repositories = await repositoriesService.findMany({
    where: { institutionId: ctx.state.institution.id },
    include,
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(repositories) ? repositories : [];
};

exports.getInstitutionMembers = async (ctx) => {
  const { include: propsToInclude } = ctx.query;
  let include;

  if (Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  const memberships = await membershipService.findMany({
    where: { institutionId: ctx.state.institution.id },
    include,
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(memberships) ? memberships : [];
};

exports.getInstitutionContacts = async (ctx) => {
  const members = await ctx.state.institution.getContacts();

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(members) ? members : [];
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

  const schema = connectedUser?.isAdmin ? membershipAdminUpsertSchema : membershipUpsertSchema;
  const { value: body } = schema.validate({
    ...ctx.request.body,
    institutionId,
    username,
  });

  ctx.metadata = {
    institutionId,
    institutionName,
    username,
  };

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

  const { roles } = body;
  const membership = user.memberships?.[0];
  const memberIsContact = membership?.roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);
  const memberBecomesContact = roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  const membershipData = {
    ...body,
    user: { connect: { username } },
    institution: { connect: { id: institutionId } },
  };

  const newMembership = await membershipsService.upsert({
    where: {
      username_institutionId: { username, institutionId },
    },
    create: membershipData,
    update: membershipData,
  });
  appLogger.info(`Membership between user [${username}] and institution [${institutionId}] is upserted`);

  if (!memberIsContact && memberBecomesContact) {
    try {
      await sendNewContact(user.email);
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
    await membershipService.delete({
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

exports.getSushiData = async (ctx) => {
  const sushiItems = await sushiCredentialsService.findMany({
    where: {
      institutionId: ctx.state.institution.id,
    },
    include: {
      endpoint: true,
    },
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = sushiItems;
};
