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
    ctx.throw(404, 'No assigned institution');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = institution;
};

exports.createInstitution = async (ctx) => {
  await ensureIndex();

  const { user } = ctx.state;
  const { body } = ctx.request;
  const { creator } = ctx.query;
  const { logo } = body;
  const { username, roles } = ctx.state.user;


  if (!isAdmin(user)) {
    const selfInstitution = await Institution.findOneByCreatorOrRole(username, roles);

    if (selfInstitution) {
      ctx.throw(409, 'You can not attach another institution to your profile');
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

  ctx.status = 201;
  ctx.body = institution;
};

exports.updateInstitution = async (ctx) => {
  const { user, institution } = ctx.state;
  const { body } = ctx.request;

  if (!body) {
    ctx.throw(400, 'body is empty');
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

exports.validateInstitution = async (ctx) => {
  const { body = {} } = ctx.request;
  const { value: validated } = body;
  const { institution } = ctx.state;

  institution.setValidation(validated);

  if (validated) {
    await institution.createSpace();
    await institution.createBaseIndex();
    await institution.createIndexPattern();
    await institution.createRoles();
    await institution.migrateCreator();
  }

  await institution.save();

  ctx.status = 200;
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
  const { institution, userIsAdmin } = ctx.state;
  const { username } = ctx.params;
  const { body = {} } = ctx.request;
  const { readonly = true } = body;

  const role = institution.getRole();
  const readonlyRole = institution.getRole({ readonly: true });

  if (!role) {
    ctx.throw(409, 'The institution has no role set');
  }

  const member = await elastic.security.findUser({ username });

  if (!member) {
    ctx.throw(404, 'User not found');
  }
  if (institution.isContact(member) && !userIsAdmin) {
    ctx.throw(409, 'You can\'t update an institution contact');
  }

  const userRoles = new Set(Array.isArray(member.roles) ? member.roles : []);

  userRoles.add(readonly ? readonlyRole : role);
  userRoles.delete(readonly ? role : readonlyRole);

  member.roles = Array.from(userRoles);

  try {
    await elastic.security.putUser({ username, refresh: true, body: member });
  } catch (e) {
    ctx.throw(500, 'Failed to update user roles');
    appLogger.error('Failed to update user roles', e);
  }

  ctx.status = 200;
  ctx.body = { message: 'user updated' };
};

exports.removeInstitutionMember = async (ctx) => {
  const { institution, userIsAdmin } = ctx.state;
  const { username } = ctx.params;

  const role = institution.getRole();
  const readonlyRole = institution.getRole({ readonly: true });

  if (!role) {
    ctx.throw(409, 'The institution has no role set');
  }

  const member = await elastic.security.findUser({ username });

  if (!member) {
    ctx.throw(404, 'User not found');
  }
  if (institution.isContact(member) && !userIsAdmin) {
    ctx.throw(409, 'You can\'t remove an institution contact');
  }

  const userRoles = new Set(Array.isArray(member.roles) ? member.roles : []);

  if (!userRoles.has(role) && !userRoles.has(readonlyRole)) {
    ctx.status = 200;
    ctx.body = { message: 'nothing to do' };
    return;
  }

  userRoles.delete(role);
  userRoles.delete(readonlyRole);

  member.roles = Array.from(userRoles);

  try {
    await elastic.security.putUser({ username: member.username, refresh: true, body: member });
  } catch (e) {
    ctx.throw(500, 'Failed to update user roles');
    appLogger.error('Failed to update user roles', e);
  }

  ctx.status = 200;
  ctx.body = { message: 'user updated' };
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
