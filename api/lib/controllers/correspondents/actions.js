const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('config');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');
const depositors = require('../../services/depositors');
const { appLogger } = require('../../../server');

const instance = axios.create({
  baseURL: 'https://api.opendata.onisep.fr/downloads/57da952417293/57da952417293.json',
  timeout: 30000,
  headers: {
    'Application-ID': 'ezMESURE',
  },
});

const indiciesExists = async function () {
  const { body: exists } = await elastic.indices.exists({ index: config.depositors.index });

  if (!exists) {
    await elastic.indices.create({
      index: config.depositors.index,
      body: indexTemplate,
    });
  }
};

const getEtablishmentData = async function (uai) {
  try {
    const { data: res } = await instance.get('');

    if (res) {
      return Object.values(res).find((e) => e.code_uai === uai);
    }
  } catch (err) {
    appLogger.error('Failed to get establishment data', err);
    return null;
  }

  return null;
};

exports.list = async function (ctx) {
  indiciesExists();

  ctx.type = 'json';

  ctx.body = await depositors.getFromIndex();
};

exports.updateData = async function (ctx) {
  indiciesExists();

  const { body } = ctx.request;

  if (!body || !body.establisment) {
    ctx.status = 400;
    ctx.body = {
      status: 400,
      error: 'No data send',
    };
  }

  const docId = body.establishment.id;
  delete body.establishment.id;

  body.establishment.updatedAt = new Date();

  ctx.status = 204;

  return elastic.update({
    id: docId,
    index: config.depositors.index,
    body: {
      doc: body.establishment,
    },
  });
};

exports.deleteData = async function (ctx) {
  indiciesExists();

  ctx.status = 204;

  const { body } = ctx.request;
  
  if (body.ids && body.ids.length) {
    try {
      for (let i = 0; i < body.ids.length; i += 1) {
        await elastic.delete({
          id: body.ids[i],
          index: config.depositors.index,
        });
      }
    } catch (error) {
      appLogger.error('Failed to delete establishment', error);
    }

    ctx.status = 200;
    ctx.body = 'OK';
  }
};

exports.storeData = async function (ctx) {
  indiciesExists();

  const { body } = ctx.request;
  const { logo } = ctx.request.files;

  let logoId = '';
  if (logo) {
    try {
      const dest = path.resolve(__dirname, '..', '..', '..', 'uploads');

      logoId = crypto.randomBytes(16).toString('hex');

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }

      fs.createReadStream(path.resolve(logo.path))
        .pipe(fs.createWriteStream(path.resolve(dest, `${logoId}.png`)));
    } catch (err) {
      appLogger.error('Failed store logo', err);
    }
  }

  const currentDate = new Date();

  const indexData = {
    organisation: {
      name: body.name,
      shortName: '',
      uai: body.uai || '',
      city: '',
      website: body.url || '',
      logoUrl: logoId || '',
      establismentType: '',
      location: {
        lon: 0,
        lat: 0,
      },
      domains: [],
    },
    auto: {
      ezmesure: false,
      ezpaarse: false,
      report: false,
    },
    contacts: [
      {
        fullName: ctx.state.user.full_name,
        mail: ctx.state.user.email,
        type: body.correspondent ? body.correspondent.split(',') : ['default'],
        confirmed: false,
      },
    ],
    index: {
      count: 0,
      prefix: body.indexAffected,
      suggested: body.indexSuggested,
    },
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  if (body.uai) {
    try {
      const establisment = await getEtablishmentData(body.uai);

      if (establisment) {
        indexData.organisation.shortName = establisment.sigle;
        indexData.organisation.city = establisment.commune;
        indexData.organisation.establismentType = establisment.type_detablissement;
        indexData.organisation.location.lon = establisment.longitude_x;
        indexData.organisation.location.lat = establisment.latitude_y;
      }
    } catch (err) {
      appLogger.error('Failed to get establishment data', err);
    }
  }

  ctx.status = 200;

  return elastic.index({
    index: config.depositors.index,
    body: indexData,
  }).then((res) => res.body).catch((err) => appLogger.error('Failed to store data in index', err));
};

exports.pictures = async function (ctx) {
  ctx.type = 'image/png';
  ctx.status = 200;

  const { id } = ctx.params;
  if (id) {
    const logo = fs.createReadStream(path.resolve(__dirname, '..', '..', '..', 'uploads', `${id}.png`));
    ctx.body = logo;
    return ctx;
  }

  ctx.status = 400;
  return ctx;
};
