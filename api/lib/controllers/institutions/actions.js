const config = require('config');
const elastic = require('../../services/elastic');
const depositors = require('../../services/depositors');
const indexTemplate = require('../../utils/depositors-template');
const { appLogger } = require('../../../server');

const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');

const depositorsIndex = config.depositors.index;

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
      ctx.throw(409, ctx.$t('errors.institution.alreadyAssigned'));
      return;
    }
  }

  const institution = new Institution(body, {
    schema: isAdmin(user) ? Institution.schema : Institution.updateSchema,
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

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.get('name'),
  };

  if (!body) {
    ctx.throw(400, ctx.$t('errors.emptyBody'));
    return;
  }

  institution.update(body, {
    schema: isAdmin(user) ? Institution.schema : Institution.updateSchema,
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

  ctx.status = 200;
  ctx.body = institution;
};

exports.deleteInstitutions = async (ctx) => {
  const { body } = ctx.request;
  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
        // FIXME: use bulk query
        await Institution.deleteOne(body.ids[i]);
        response.push({ id: body.ids[i], status: 'deleted' });
      } catch (error) {
        response.push({ id: body.ids[i], status: 'failed' });
        appLogger.error('Failed to delete institution', error);
      }
    }

    ctx.status = 200;
    ctx.body = response;
  }
};

exports.deleteInstitution = async (ctx) => {
  const { institutionId } = ctx.params;

  ctx.status = 200;
  ctx.body = await Institution.deleteOne(institutionId);
};

exports.getInstitutionMembers = async (ctx) => {
  const members = await ctx.state.institution.getMembers();

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

  // If the user is not already a member, check if it belongs to another institution
  if (!institution.isMember(member) && !institution.isCreator(member)) {
    const memberInstitution = await Institution.findOneByCreatorOrRole(
      member.username,
      member.roles,
    );

    if (memberInstitution) {
      ctx.throw(409, ctx.$t('errors.members.alreadyMember'));
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

exports.refreshInstitutions = async (ctx) => {
  const results = await depositors.refresh();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = results;
};

exports.refreshInstitution = async (ctx) => {
  await ctx.state.institution.refreshIndexCount();
  await ctx.state.institution.refreshContacts();

  ctx.status = 200;
  ctx.body = ctx.state.institution;
};

exports.getSushiData = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await Sushi.findByInstitutionId(ctx.state.institution.id);
};
