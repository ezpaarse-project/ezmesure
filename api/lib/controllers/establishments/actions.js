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

const ensureIndex = async function () {
  const { body: exists } = await elastic.indices.exists({ index: config.depositors.index });

  if (!exists) {
    await elastic.indices.create({
      index: config.depositors.index,
      body: indexTemplate,
    });
  }
};

const getEtablishmentDataByUAI = async function (uai) {
  try {
    const { data: res } = await instance.get('');

    if (!res) { return {}; }

    const data = Object.values(res).find((e) => e.code_uai === uai);
    
    return {
      shortName: data.sigle,
      city: data.commune,
      establismentType: data.type_detablissement,
      location: {
        lon: data.longitude_x,
        lat: data.latitude_y,
      },
    };
  } catch (err) {
    appLogger.error('Failed to get establishment data', err);
    return {};
  }

  return {};
};

const getEtablishmentData = async function (email, source) {
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
        _source: source,
      },
    });

    if (!body || !body.hits || !body.hits.hits) {
      return {};
    }

    const establishment = body.hits.hits.shift();

    if (!establishment) { return null; }

    return {
      id: establishment._id,
      ...establishment._source,
    };
  } catch (error) {
    return null;
  }
};

const addLogo = async function (logo) {
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
  return null;
};

exports.getEtablishments = async function (ctx) {
  ensureIndex();

  ctx.type = 'json';

  ctx.body = await depositors.getFromIndex();
};

exports.getEtablishment = async function (ctx) {
  ensureIndex();

  const { email } = ctx.params;

  ctx.type = 'json';
  ctx.status = 200;

  let establishment = await getEtablishmentData(email, [
    'organisation.name',
    'organisation.uai',
    'organisation.website',
    'organisation.logo',
    'index.prefix',
    'index.suggested',
  ]);

  if (!establishment) {
    establishment = {
      organisation: {
        name: '',
        uai: '',
        website: '',
        logoId: '',
      },
      index: {
        prefix: '',
        suggested: '',
      },
    };
  }

  const index = ctx.state.user.email.match(/@(\w+)/i);
  if (index && !establishment.index.prefix) {
    const [, indexPrefix] = index;
    establishment.index.suggested = indexPrefix;
    establishment.index.prefix = indexPrefix;
  }

  ctx.body = establishment;
};

exports.storeEstablishment = async function (ctx) {
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

  establishment.organisation.establismentType = '';
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
      const establismentUAIData = await getEtablishmentDataByUAI(establishment.organisation.uai);

      if (establismentUAIData) {
        establishment.organisation = {
          ...establishment.organisation,
          ...establismentUAIData,
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

exports.updateEstablishment = async function (ctx) {
  const { establishmentId } = ctx.params;

  const { body } = ctx.request;
  const { form } = body;
  const { logo } = ctx.request.files;

  if (!body || !form) {
    ctx.status = 400;
    return ctx;
  }

  const establishment = JSON.parse(form);

  let logoId;
  if (logo) {
    logoId = await addLogo(logo);
    establishment.organisation.logoId = logoId || '';
  }

  if (establishment.organisation.uai) {
    try {
      const establismentUAIData = await getEtablishmentDataByUAI(establishment.organisation.uai);

      if (establismentUAIData) {
        establishment.organisation = {
          ...establishment.organisation,
          ...establismentUAIData,
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

exports.deleteEstablishments = async function (ctx) {
  const { body } = ctx.request;

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      try {
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

exports.getCorrespondents = async function (ctx) {
  const { email } = ctx.params;

  ctx.type = 'json';
  ctx.status = 200;

  const establishment = await getEtablishmentData(email, [ 'contacts' ]);

  if (!establishment) {
    ctx.status = 404;
    return;
  }

  ctx.body = {
    id: establishment.id,
    contact: establishment.contacts.find(sushi => sushi.email === email) || [],
  };
};

exports.updateCorrespondent = async function (ctx) {
  const { establishmentId, email } = ctx.params;
  const { body } = ctx.request

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
        source: 'def targets = ctx._source.contacts.findAll(contact -> contact.id == params.id);' +
          'for(contact in targets) {' +
            'contact.id = params.id;' +
            'contact.type = params.type;' +
            'contact.email = params.email;' +
            'contact.confirmed = params.confirmed;' +
            'contact.fullName = params.fullName;' +
          '}',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.getSushiData = async function (ctx) {
  const { email } = ctx.params;

  ctx.type = 'json';
  ctx.status = 200;

  const establishment = await getEtablishmentData(email, [ 'sushi' ]);

  if (!establishment) {
    ctx.status = 404;
    return;
  }

  const sushi = establishment.sushi.map((sushi) => {
    if (sushi.owner === email) {

      if (sushi.requestorId) {
        sushi.requestorId = encrypter.decrypt(sushi.requestorId);
      }
      if (sushi.customerId) {
        sushi.customerId = encrypter.decrypt(sushi.customerId);
      }
      if (sushi.apiKey) {
        sushi.apiKey = encrypter.decrypt(sushi.apiKey);
      }

      return sushi;
    }
  });

  ctx.body = {
    id: establishment.id,
    sushi,
  };
};

exports.addSushi = async function (ctx) {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request

  ctx.status = 200;

  body.id = uuidv4();
  body.owner = ctx.state.user.email;

  if (body.requestorId) {
    body.requestorId = encrypter.encrypt(body.requestorId);
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
      doc: {
        sushi: [
          body,
        ],
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.updateSushi = async function (ctx) {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request

  ctx.status = 200;

  if (body.requestorId) {
    body.requestorId = encrypter.encrypt(body.requestorId);
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
        source: 'def targets = ctx._source.sushi.findAll(sushi -> sushi.id == params.id);' +
          'for(sushi in targets) {' +
            'sushi.id = params.id;' +
            'sushi.vendor = params.vendor;' +
            'sushi.package = params.package;' +
            'sushi.sushiUrl = params.sushiUrl;' +
            'sushi.requestorId = params.requestorId;' +
            'sushi.customerId = params.customerId;' +
            'sushi.apiKey = params.apiKey;' +
            'sushi.comment = params.comment;' +
            'sushi.owner = params.owner;' +
          '}',
        params: body,
      },
    },
  }).catch((err) => {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  });
};

exports.deleteSushiData = async function (ctx) {
  const { establishmentId } = ctx.params;
  const { body } = ctx.request

  let establishment = null;
  try {
    establisment = await elastic.getSource({
      index: config.depositors.index,
      id: establishmentId,
      refresh: true,
    });
  } catch(err) {
    ctx.status = 500;
    appLogger.error('Failed to update data in index', err);
  }

  if (!establisment || !establisment.body) {
    ctx.status = 404;
    return ctx;
  }

  const response = [];

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (let i = 0; i < body.ids.length; i += 1) {
      
      try {
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

exports.pictures = async function (ctx) {
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
