const config = require('config');
const elastic = require('../../services/elastic');
const depositors = require('../../services/depositors');
const indexTemplate = require('../../utils/depositors-template');

const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');
const Task = require('../../models/Task');

const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

const depositorsIndex = config.depositors.index;

function sendValidateInstitution(receivers, data) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supportRecipients,
    subject: 'Votre établissement a été validé',
    ...generateMail('validate-institution', data),
  });
}

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

const ensureIndex = async () => {
  const { body: exists } = await elastic.indices.exists({ index: depositorsIndex });

  if (!exists) {
    await elastic.indices.create({
      index: depositorsIndex,
      body: indexTemplate,
    });
  }
};

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
  await ensureIndex();

  ctx.type = 'json';
  ctx.body = await Institution.findAll();
};

exports.getInstitution = async (ctx) => {
  await ensureIndex();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = ctx.state.institution;
};

exports.getSelfInstitution = async (ctx) => {
  await ensureIndex();

  const { username, roles } = ctx.state.user;
  const institution = await Institution.findOneByCreatorOrRole(username, roles);

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notAssigned'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = institution;
};

exports.createInstitution = async (ctx) => {
  ctx.action = 'institutions/create';
  await ensureIndex();

  const { user } = ctx.state;
  const { body } = ctx.request;
  const { creator } = ctx.query;
  const { logo } = body;
  const { username, roles } = ctx.state.user;

  ctx.metadata = {
    institutionName: body.name,
  };

  if (!isAdmin(user)) {
    const selfInstitution = await Institution.findOneByCreatorOrRole(username, roles);

    if (selfInstitution) {
      ctx.throw(409, ctx.$t('errors.institution.alreadyAttached'));
      return;
    }
  }

  const institution = new Institution(body, {
    schema: isAdmin(user) ? 'adminCreate' : 'create',
  });

  if (!isAdmin(user) || creator !== false) {
    institution.setCreator(username);
  }

  if (logo) {
    await institution.updateLogo(logo);
  }

  await institution.save();

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
    institutionName: institution.get('name'),
  };

  if (!body) {
    ctx.throw(400, ctx.$t('errors.emptyBody'));
    return;
  }

  const wasValidated = institution.get('validated');
  const wasSushiReady = institution.get('sushiReadySince');

  institution.update(body, {
    schema: isAdmin(user) ? 'adminUpdate' : 'update',
  });

  if (body.logo) {
    await institution.updateLogo(body.logo);
  } else if (body.logo === null) {
    await institution.removeLogo();
  }

  try {
    await institution.save();
  } catch (e) {
    throw new Error(e);
  }

  if (!wasValidated && body.validated === true) {
    let contacts = await institution.getContacts();
    contacts = contacts?.map?.((e) => e.email);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitution(contacts, {
          manageMemberLink: `${origin}/institutions/self/members`,
          manageSushiLink: `${origin}/institutions/self/sushi`,
        });
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  const sushiReadySince = institution.get('sushiReadySince');
  const sushiReadyChanged = (wasSushiReady && sushiReadySince === null)
                         || (!wasSushiReady && sushiReadySince);

  if (sushiReadyChanged) {
    sendMail({
      from: sender,
      to: supportRecipients,
      subject: sushiReadySince ? 'Fin de saisie SUSHI' : 'Reprise de saisie SUSHI',
      ...generateMail('sushi-ready-change', {
        institutionName: institution.get('name'),
        institutionSushiLink: `${origin}/institutions/${institution.getId()}/sushi`,
        sushiReadySince,
      }),
    }).catch((err) => {
      appLogger.error(`Failed to send sushi-ready-change mail: ${err}`);
    });
  }

  ctx.status = 200;
  ctx.body = institution;
};

exports.deleteInstitution = async (ctx) => {
  ctx.action = 'institutions/delete';
  const { institutionId } = ctx.params;
  const { institution } = ctx.state;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.get('name'),
  };

  ctx.status = 200;
  ctx.body = await Institution.deleteOne(institutionId);
};

exports.getInstitutionMembers = async (ctx) => {
  const members = await ctx.state.institution.getMembers();

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
    readonly = true,
    docContact,
    techContact,
  } = body;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.get('name'),
    username,
  };

  const role = institution.getRole();
  const readonlyRole = institution.getRole({ readonly: true });

  if (!role) {
    ctx.throw(409, ctx.$t('errors.institution.noRole'));
  }

  const member = await elastic.security.findUser({ username });

  if (!member) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  // Only admins can update institution contacts
  if (institution.isContact(member) && !userIsAdmin) {
    ctx.throw(409, ctx.$t('errors.members.cannotUpdateContact'));
  }

  const wasContact = institution.isContact(member);

  // If the user is not already a member, check if it belongs to another institution
  if (!institution.isMember(member) && !institution.isCreator(member)) {
    const memberInstitution = await Institution.findOneByCreatorOrRole(
      member.username,
      member.roles,
    );

    if (memberInstitution) {
      ctx.throw(409, ctx.$t('errors.members.alreadyMember', memberInstitution.get('name')));
      return;
    }
  }

  const userRoles = new Set(Array.isArray(member.roles) ? member.roles : []);

  userRoles.add(readonly ? readonlyRole : role);
  userRoles.delete(readonly ? role : readonlyRole);

  if (userIsAdmin) {
    if (docContact === true) { userRoles.add(Institution.docRole()); }
    if (docContact === false) { userRoles.delete(Institution.docRole()); }
    if (techContact === true) { userRoles.add(Institution.techRole()); }
    if (techContact === false) { userRoles.delete(Institution.techRole()); }
  }

  member.roles = Array.from(userRoles);

  try {
    await elastic.security.putUser({ username, refresh: true, body: member });
  } catch (e) {
    ctx.throw(500, ctx.$t('errors.user.failedToUpdateRoles'));
  }

  if (institution.isCreator(member)) {
    institution.setCreator(null);
    await institution.save();
  }

  if (!wasContact && institution.isContact(member)) {
    try {
      await sendNewContact(member.email);
    } catch (err) {
      appLogger.error(`Failed to send new contact mail: ${err}`);
    }
  }

  ctx.status = 200;
  ctx.body = { message: 'user updated' };
};

exports.removeInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/removeMember';

  const { institution, userIsAdmin } = ctx.state;
  const { username } = ctx.params;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.get('name'),
    username,
  };

  const role = institution.getRole();
  const readonlyRole = institution.getRole({ readonly: true });

  if (!role) {
    ctx.throw(409, ctx.$t('errors.institution.noRole'));
  }

  const member = await elastic.security.findUser({ username });

  if (!member) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }
  if (institution.isContact(member) && !userIsAdmin) {
    ctx.throw(409, ctx.$t('errors.members.cannotRemoveContact'));
  }

  const userRoles = new Set(Array.isArray(member.roles) ? member.roles : []);

  if (!userRoles.has(role) && !userRoles.has(readonlyRole)) {
    ctx.status = 200;
    ctx.body = { message: ctx.$t('nothingToDo') };
    return;
  }

  userRoles.delete(role);
  userRoles.delete(readonlyRole);

  member.roles = Array.from(userRoles);

  try {
    await elastic.security.putUser({ username: member.username, refresh: true, body: member });
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
