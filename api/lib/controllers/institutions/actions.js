const config = require('config');
const institutionsService = require('../../entities/institutions.service');
const institutionsDto = require('../../entities/institutions.dto');
const membershipService = require('../../entities/memberships.service');
const usersService = require('../../entities/users.service');

const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');

const imagesService = require('../../services/images');
const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

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
  ctx.type = 'json';
  ctx.body = await institutionsService.findMany({});
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
        isDocContact: true,
        isTechContact: true,
      }],
    };
  }

  if (base64logo) {
    institutionData.logoId = await imagesService.storeLogo(base64logo);
  }

  const institution = await institutionsService.create({
    data: { ...institutionData, memberships },
  });

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

  if (institutionData.logo && oldLogoId) {
    await imagesService.remove(oldLogoId);
  }

  if (!wasValidated && institutionData.validated === true) {
    const contactMemberships = await membershipService.findMany({
      where: {
        institutionId: ctx.state.institution.id,
        OR: [
          { isDocContact: true },
          { isTechContact: true },
        ],
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

  ctx.status = 200;
  ctx.body = await institutionsService.delete({ where: { id: institutionId } });
};

exports.getInstitutionMembers = async (ctx) => {
  const members = await membershipService.findMany({
    where: { institutionId: ctx.state.institution.id },
    include: { user: true },
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(members) ? members : [];
};

exports.getInstitutionContacts = async (ctx) => {
  const members = await ctx.state.institution.getContacts();

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(members) ? members : [];
};

exports.addInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/addMember';

  const { institution, userIsAdmin } = ctx.state;
  const { username } = ctx.params;
  const { body = {} } = ctx.request;
  const {
    id: institutionId,
    name: institutionName,
  } = institution;
  const {
    isDocContact = false,
    isTechContact = false,
    isGuest = false,
  } = body;

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

  const membership = user.memberships?.[0];
  const memberIsContact = membership?.isDocContact || membership?.isTechContact;
  const memberBecomesContact = isDocContact || isTechContact;
  let newMembership;

  // Only admins can update institution contacts
  if ((memberIsContact || memberBecomesContact) && !userIsAdmin) {
    ctx.throw(409, ctx.$t('errors.members.cannotUpdateContact'));
  }

  if (membership) {
    newMembership = await membershipService.update({
      where: {
        username_institutionId: { username, institutionId },
      },
      data: {
        isDocContact,
        isTechContact,
        isGuest,
      },
    });
  } else {
    newMembership = await membershipService.create({
      data: {
        isDocContact,
        isTechContact,
        isGuest,
        user: { connect: { username } },
        institution: { connect: { id: institutionId } },
      },
    });
  }

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

  const { institution, userIsAdmin } = ctx.state;
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
  const memberIsContact = membership?.isDocContact || membership?.isTechContact;

  if (memberIsContact && !userIsAdmin) {
    ctx.throw(409, ctx.$t('errors.members.cannotRemoveContact'));
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
  const options = {};
  const connection = ctx.query?.connection;

  if (connection === 'untested') {
    options.must_not = [{
      exists: { field: `${Sushi.type}.connection.success` },
    }];
  } else if (connection) {
    options.filters = [{
      term: { [`${Sushi.type}.connection.success`]: connection === 'working' },
    }];
  }

  const sushiItems = await Sushi.findByInstitutionId(ctx.state.institution.id, options);

  if (ctx?.query?.latestImportTask) {
    const sushiMap = new Map(sushiItems.map((item) => [item.getId(), item]));
    const latestTasks = await Task.findOnePerSushiId(Array.from(sushiMap.keys()));

    if (Array.isArray(latestTasks)) {
      latestTasks.forEach((task) => {
        const sushiItem = sushiMap.get(task?.getParam?.('sushiId'));
        if (sushiItem) {
          sushiItem.set('latestImportTask', task);
        }
      });
    }
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = sushiItems;
};
