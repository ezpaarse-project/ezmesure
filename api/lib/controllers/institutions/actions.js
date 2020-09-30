const axios = require('axios');
const config = require('config');
const { v4: uuidv4 } = require('uuid');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');
const { appLogger } = require('../../../server');

const Institution = require('../../models/Institution');
const Sushi = require('../../models/Sushi');

const depositorsIndex = config.depositors.index;

const instance = axios.create({
  baseURL: 'https://api.opendata.onisep.fr/downloads/57da952417293/57da952417293.json',
  timeout: 30000,
  headers: {
    'Application-ID': 'ezMESURE',
  },
});

const isAdmin = (user) => {
  const roles = new Set((user && user.roles) || []);
  return (roles.has('admin') || roles.has('superuser'));
};

const isMember = (institution, email) => {
  const members = (institution && institution.members) || [];
  return members.some((contact) => contact.email === email);
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

const getInstitutionDataByUAI = async (uai) => {
  try {
    const { data: res } = await instance.get('');

    if (!res) { return {}; }

    const data = Object.values(res).find((e) => e.code_uai === uai);

    return {
      acronym: data.sigle,
      city: data.commune,
      type: data.type_detablissement,
      location: {
        lon: data.longitude_x,
        lat: data.latitude_y,
      },
    };
  } catch (err) {
    appLogger.error('Failed to get institution data', err);
    return {};
  }
};

const getInstitutionData = async (email, sourceFilter) => {
  try {
    const { body } = await elastic.search({
      index: depositorsIndex,
      body: {
        query: {
          nested: {
            path: 'members',
            query: {
              bool: {
                must: [
                  {
                    match: {
                      'members.email': email,
                    },
                  },
                ],
              },
            },
          },
        },
        _source: sourceFilter,
      },
    });

    if (!body || !body.hits || !body.hits.hits) {
      return {};
    }

    const institution = body.hits.hits.shift();

    if (!institution) { return null; }

    const { _id: id, _source: source } = institution;
    return { ...source, id };
  } catch (error) {
    return null;
  }
};

exports.getInstitutions = async (ctx) => {
  await ensureIndex();

  ctx.type = 'json';
  ctx.body = await Institution.findAll();
};

exports.getInstitution = async (ctx) => {
  await ensureIndex();

  const { institutionId } = ctx.params;

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = institution;
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
  const { logo } = body;
  const { username } = ctx.state.user;

  const institution = new Institution(body, {
    schema: isAdmin(user) ? Institution.schema : Institution.updateSchema,
  });
  institution.setCreator(username);

  if (logo) {
    await institution.updateLogo(logo);
  }

  await institution.save();

  ctx.status = 201;
  ctx.body = institution;

  // if (institution.uai) {
  //   try {
  //     const institutionUAIData = await getInstitutionDataByUAI(institution.uai);

  //     if (institutionUAIData) {
  //       institution = {
  //         ...institution,
  //         ...institutionUAIData,
  //       };
  //     }
  //   } catch (err) {
  //     appLogger.error('Failed to get institution data', err);
  //   }
  // }
};

exports.updateInstitution = async (ctx) => {
  const { institutionId } = ctx.params;
  const { user } = ctx.state;
  const { body } = ctx.request;

  if (!body) {
    ctx.throw(400, 'body is empty');
    return;
  }

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  if (!institution.isContact(user) && !isAdmin(user)) {
    ctx.throw(403, 'You are not authorized to update this institution data');
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

  // if (institution.uai) {
  //   try {
  //     const institutionUAIData = await getInstitutionDataByUAI(institution.uai);

  //     if (institutionUAIData) {
  //       institution = {
  //         ...institution,
  //         ...institutionUAIData,
  //       };
  //     }
  //   } catch (err) {
  //     appLogger.error('Failed to get institution data', err);
  //   }
  // }

  try {
    await institution.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = institution;
};

exports.validateInstitution = async (ctx) => {
  const { institutionId } = ctx.params;
  const { user } = ctx.state;
  const { body = {} } = ctx.request;
  const { value: validated } = body;

  if (!isAdmin(user)) {
    ctx.throw(403, 'You are not allowed to validate this institution');
    return;
  }

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  institution.setValidation(validated);

  if (validated) {
    await institution.createRole();
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
  const { institutionId } = ctx.params;
  const { user } = ctx.state;

  const { body: institution, statusCode } = await elastic.getSource({
    index: depositorsIndex,
    id: institutionId,
  }, { ignore: [404] });

  if (!institution || statusCode === 404) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  if (!isMember(institution, user.email) && !isAdmin(user)) {
    ctx.throw(403, 'You are not allowed to access this institution data');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(institution.members) ? institution.members : [];
};

exports.updateMember = async (ctx) => {
  const { institutionId } = ctx.params;
  let { email } = ctx.params;
  const { body } = ctx.request;

  if (email === 'self') {
    email = ctx.state.user.email;
  }

  ctx.status = 200;

  if (!body.id) {
    body.id = uuidv4();
  }

  await elastic.update({
    index: depositorsIndex,
    id: institutionId,
    refresh: true,
    body: {
      script: {
        source: 'def targets = ctx._source.members.findAll(contact -> contact.email == params.email);'
          + 'for(contact in targets) {'
          + 'contact.id = params.id;'
          + 'contact.type = params.type;'
          + 'contact.email = params.email;'
          + 'contact.confirmed = params.confirmed;'
          + 'contact.fullName = params.fullName;'
          + '}',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.getSushiData = async (ctx) => {
  const { user } = ctx.state;
  const { institutionId } = ctx.params;

  const institution = await Institution.findById(institutionId);

  if (!institution) {
    ctx.throw(404, 'Institution not found');
    return;
  }

  if (!institution.isContact(user) && !isAdmin(user)) {
    ctx.throw(403, 'You are not allowed to access this institution');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await Sushi.findByInstitutionId(institutionId);
};
