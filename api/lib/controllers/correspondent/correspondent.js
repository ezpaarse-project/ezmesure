const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { depositors } = require('config');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');
const { appLogger } = require('../../../server');
const { appLogger } = require('../../../server');

const instance = axios.create({
  baseURL: 'https://api.opendata.onisep.fr/downloads/57da952417293/57da952417293.json',
  timeout: 30000,
  headers: {
    'Application-ID': 'ezMESURE',
  },
});

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

exports.storeData = async function (ctx) {
  const { body: exists } = await elastic.indices.exists({ index: depositors.index });

  if (!exists) {
    await elastic.indices.create({
      index: depositors.index,
      body: indexTemplate,
    });
  }

  const { body } = ctx.request;
  const { logo } = ctx.request.files;

  let base64Logo = '';
  if (logo) {
    try {
      const dest = path.resolve(__dirname, '..', '..', '..', 'uploads');

      base64Logo = crypto.randomBytes(16).toString('hex');

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }

      fs.createReadStream(path.resolve(logo.path))
        .pipe(fs.createWriteStream(path.resolve(dest, `${base64Logo}.png`)));
    } catch (err) {
      appLogger.error('Failed store logo', err);
    }
  }

  const indexData = {
    organisation: {
      name: body.name,
      nomCourt: '',
      uai: body.uai,
      city: '',
      website: body.url || '',
      logoUrl: base64Logo || '',
    },
    auto: {
      ezmesure: false,
      ezpaarse: false,
      report: false,
    },
    contact: {
      confirmed: false,
      users: [
        {
          fullName: ctx.state.user.full_name,
          mail: ctx.state.user.email,
          type: body.correspondent ? body.correspondent.split(',') : ['default'],
        },
      ],
    },
    index: {
      prefix: body.indexAffected,
      count: 0,
    },
    location: {
      lon: 0,
      lat: 0,
    },
  };

  if (body.uai) {
    try {
      const establisment = await getEtablishmentData(body.uai);

      if (establisment) {
        indexData.sigle.nomCourt = establisment.sigle;
        indexData.organisation.city = establisment.commune;
        indexData.location.lon = establisment.longitude_x;
        indexData.location.lat = establisment.latitude_y;
      }
    } catch (err) {
      appLogger.error('Failed to get establishment data', err);
    }
  }

  ctx.status = 200;

  return elastic.index({
    index: depositors.index,
    body: indexData,
  }).then((res) => res.body).catch((err) => appLogger.error('Failed to store data in index', err));
};
