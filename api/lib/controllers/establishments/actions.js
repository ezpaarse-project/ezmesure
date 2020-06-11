const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const { v4: uuidv4 } = require('uuid');
const { randomBytes } = require('crypto');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');
const depositors = require('../../services/depositors');
const encrypter = require('../../services/encrypter');
const { appLogger } = require('../../../server');

const instance = axios.create({
  baseURL: 'https://api.opendata.onisep.fr/downloads/57da952417293/57da952417293.json',
  timeout: 30000,
  headers: {
    'Application-ID': 'ezMESURE',
  },
});

const ensureIndex = async () => {
  const { body: exists } = await elastic.indices.exists({ index: config.depositors.index });

  if (!exists) {
    await elastic.indices.create({
      index: config.depositors.index,
      body: indexTemplate,
    });
  }
};

const getEtablishmentDataByUAI = async (uai) => {
  try {
    const { data: res } = await instance.get('');

    if (!res) { return {}; }

    const data = Object.values(res).find((e) => e.code_uai === uai);

    return {
      shortName: data.sigle,
      city: data.commune,
      establishmentType: data.type_detablissement,
      location: {
        lon: data.longitude_x,
        lat: data.latitude_y,
      },
    };
  } catch (err) {
    appLogger.error('Failed to get establishment data', err);
    return {};
  }
};

const getEtablishmentData = async (email, sourceFilter) => {
  try {
    const { body } = await elastic.search({
      index: config.depositors.index,
      body: {
        query: {
          nested: {
            path: 'contacts',
            query: {
              bool: {
                must: [
                  {
                    match: {
                      'contacts.email': email,
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

    const establishment = body.hits.hits.shift();

    if (!establishment) { return null; }

    const { _id: id, _source: source } = establishment;
    return { ...source, id };
  } catch (error) {
    return null;
  }
};

const addLogo = async (logo) => {
  try {
    const dest = path.resolve(__dirname, '..', '..', '..', 'uploads');

    const logoId = randomBytes(16).toString('hex');

    await fs.ensureDir(dest);
    await fs.move(path.resolve(logo.path), path.resolve(dest, `${logoId}.png`));
    return logoId;
  } catch (err) {
    appLogger.error('Failed to store logo', err);
    return null;
  }
};

exports.getEtablishments = async (ctx) => {
  ensureIndex();

  ctx.type = 'json';

  ctx.body = await depositors.getFromIndex();
};

exports.getEtablishment = async (ctx) => {
  ensureIndex();

  const { email } = ctx.state.user;

  ctx.type = 'json';
  ctx.status = 200;

  const establishment = await getEtablishmentData(email, [
    'organisation.name',
    'organisation.uai',
    'organisation.website',
    'organisation.logo',
    'index.prefix',
    'index.suggested',
  ]);

  if (!establishment) {
    ctx.throw(404, 'No assigned establishment');
    return;
  }

  const index = email.match(/@(\w+)/i);

  if (index && !establishment.index.prefix) {
    const [, indexPrefix] = index;
    establishment.index.suggested = indexPrefix;
    establishment.index.prefix = indexPrefix;
  }

  ctx.body = establishment;
};

exports.storeEstablishment = async (ctx) => {
  ensureIndex();

  const { body } = ctx.request;
  const { form } = body;
  const { logo } = ctx.request.files;

  let logoId;
  if (logo) {
    logoId = await addLogo(logo);
  }

  const establishment = JSON.parse(form);
  const currentDate = new Date();

  establishment.organisation.logoId = logoId || '';

  establishment.organisation.establishmentType = '';
  establishment.organisation.city = '';
  establishment.organisation.location = {
    lon: 0,
    lat: 0,
  };
  establishment.organisation.domains = [];
  establishment.auto = {
    ezmesure: false,
    ezpaarse: false,
    report: false,
  };
  establishment.index.count = 0;
  establishment.contacts = [
    {
      id: uuidv4(),
      fullName: ctx.state.user.full_name,
      email: ctx.state.user.email,
      type: [],
      confirmed: false,
    },
  ];
  establishment.sushi = [];
  establishment.updatedAt = currentDate;
  establishment.createdAt = currentDate;

  if (establishment.organisation.uai) {
    try {
      const establishmentUAIData = await getEtablishmentDataByUAI(establishment.organisation.uai);

      if (establishmentUAIData) {
        establishment.organisation = {
          ...establishment.organisation,
          ...establishmentUAIData,
        };
      }
    } catch (err) {
      appLogger.error('Failed to get establishment data', err);
    }
  }

  ctx.status = 204;

  await elastic.index({
    index: config.depositors.index,
    refresh: true,
    body: establishment,
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to store data in index', err);
    return ctx;
  });
};

exports.updateEstablishment = async (ctx) => {
  const { establishmentId } = ctx.params;

  const { body } = ctx.request;
  const { form } = body;
  const { logo } = ctx.request.files;

  if (!body || !form) {
    ctx.status = 400;
    return;
  }

  const establishment = JSON.parse(form);

  let logoId;
  if (logo) {
    logoId = await addLogo(logo);
    establishment.organisation.logoId = logoId || '';
  }

  if (establishment.organisation.uai) {
    try {
      const establishmentUAIData = await getEtablishmentDataByUAI(establishment.organisation.uai);

      if (establishmentUAIData) {
        establishment.organisation = {
          ...establishment.organisation,
          ...establishmentUAIData,
        };
      }
    } catch (err) {
      appLogger.error('Failed to get establishment data', err);
    }
  }

  establishment.updatedAt = new Date();

  await elastic.update({
    index: config.depositors.index,
    id: establishmentId,
    refresh: true,
    body: {
      doc: establishment,
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
  ctx.status = 200;
};

exports.deleteEstablishments = async (ctx) => {
  const { body } = ctx.request;

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
        // FIXME: use bulk query
        await elastic.delete({
          id: body.ids[i],
          index: config.depositors.index,
          refresh: true,
        });
        response.push({ id: body.ids[i], status: 'deleted' });
      } catch (error) {
        response.push({ id: body.ids[i], status: 'failed' });
        appLogger.error('Failed to delete establishment', error);
      }
    }

    ctx.status = 200;
    ctx.body = response;
  }
};

exports.deleteEstablishment = async (ctx) => {
  const { establishmentId } = ctx.params;

  ctx.status = 200;

  ctx.body = await elastic.delete({
    id: establishmentId,
    index: config.depositors.index,
    refresh: true,
  });
};

exports.getEtablishmentMembers = async (ctx) => {
  const { establishmentId } = ctx.params;

  const { body: establishment, statusCode } = await elastic.getSource({
    index: config.depositors.index,
    id: establishmentId,
  }, { ignore: [404] });

  if (!establishment || statusCode === 404) {
    ctx.throw(404, 'Establishment not found');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(establishment.contacts) ? establishment.contacts : [];
};

exports.getSelfMember = async (ctx) => {
  const { email } = ctx.state.user;

  ctx.type = 'json';
  ctx.status = 200;

  const establishment = await getEtablishmentData(email, ['contacts']);

  if (!establishment) {
    ctx.status = 404;
    return;
  }

  ctx.body = {
    id: establishment.id,
    contact: establishment.contacts.find((sushi) => sushi.email === email) || [],
  };
};

exports.updateMember = async (ctx) => {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request;

  ctx.status = 200;

  if (!body.id) {
    body.id = uuidv4();
  }

  await elastic.update({
    index: config.depositors.index,
    id: establishmentId,
    refresh: true,
    body: {
      script: {
        source: 'def targets = ctx._source.contacts.findAll(contact -> contact.id == params.id);'
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
  const { email } = ctx.state.user;
  const { establishmentId } = ctx.params;

  const { body: establishment, statusCode } = await elastic.getSource({
    index: config.depositors.index,
    id: establishmentId,
  }, { ignore: [404] });

  if (!establishment || statusCode === 404) {
    ctx.throw(404, 'Establishment not found');
    return;
  }

  const contacts = Array.isArray(establishment.contacts) ? establishment.contacts : [];
  const sushiItems = Array.isArray(establishment.sushi) ? establishment.sushi : [];
  const isMember = contacts.some((contact) => contact.email === email);

  if (!isMember) {
    ctx.throw(403, 'You are not allowed to access this establishment');
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = sushiItems.map((sushiItem) => (
    {
      ...sushiItem,
      requestorId: sushiItem.requestorId && encrypter.decrypt(sushiItem.requestorId),
      customerId: sushiItem.customerId && encrypter.decrypt(sushiItem.customerId),
      apiKey: sushiItem.apiKey && encrypter.decrypt(sushiItem.apiKey),
    }
  ));
};

exports.addSushi = async (ctx) => {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request;

  ctx.status = 200;

  body.id = uuidv4();

  if (body.requestorId) {
    body.requestorId = encrypter.encrypt(body.requestorId);
  }
  if (body.consortialId) {
    body.consortialId = encrypter.encrypt(body.consortialId);
  }
  if (body.customerId) {
    body.customerId = encrypter.encrypt(body.customerId);
  }
  if (body.apiKey) {
    body.apiKey = encrypter.encrypt(body.apiKey);
  }

  await elastic.update({
    index: config.depositors.index,
    id: establishmentId,
    refresh: true,
    body: {
      script: {
        source: 'ctx._source.sushi.add(params)',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.updateSushi = async (ctx) => {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request;

  ctx.status = 200;

  if (body.requestorId) {
    body.requestorId = encrypter.encrypt(body.requestorId);
  }
  if (body.consortialId) {
    body.consortialId = encrypter.encrypt(body.consortialId);
  }
  if (body.customerId) {
    body.customerId = encrypter.encrypt(body.customerId);
  }
  if (body.apiKey) {
    body.apiKey = encrypter.encrypt(body.apiKey);
  }

  await elastic.update({
    index: config.depositors.index,
    id: establishmentId,
    refresh: true,
    body: {
      script: {
        source: 'def targets = ctx._source.sushi.findAll(sushi -> sushi.id == params.id);'
          + 'for(sushi in targets) {'
            + 'sushi.id = params.id;'
            + 'sushi.vendor = params.vendor;'
            + 'sushi.package = params.package;'
            + 'sushi.sushiUrl = params.sushiUrl;'
            + 'sushi.requestorId = params.requestorId;'
            + 'sushi.consortialId = params.consortialId;'
            + 'sushi.customerId = params.customerId;'
            + 'sushi.apiKey = params.apiKey;'
            + 'sushi.comment = params.comment;'
          + '}',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.deleteSushiData = async (ctx) => {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request;

  let establishment = null;
  try {
    establishment = await elastic.getSource({
      index: config.depositors.index,
      id: establishmentId,
      refresh: true,
    });
  } catch (err) {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  }

  if (!establishment || !establishment.body) {
    ctx.status = 404;
    return;
  }

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
        // FIXME: use bulk query
        await elastic.update({
          index: config.depositors.index,
          id: establishmentId,
          body: {
            script: {
              source: 'ctx._source.sushi.removeIf(sushi -> sushi.id == params.id)',
              params: {
                id: body.ids[i],
              },
            },
          },
        });
        response.push({ id: body.ids[i], status: 'deleted' });
      } catch (error) {
        response.push({ id: body.ids[i], status: 'failed' });
        appLogger.error('Failed to delete sushi data', error);
      }
    }

    ctx.status = 200;
    ctx.body = response;
  }
};

exports.pictures = async (ctx) => {
  ctx.type = 'image/png';
  ctx.status = 200;

  const { id } = ctx.params;
  if (id) {
    const logoPath = path.resolve(__dirname, '..', '..', '..', 'uploads', `${id}.png`);
    ctx.body = fs.createReadStream(logoPath);
    return ctx;
  }

  ctx.status = 400;
  return ctx;
};
