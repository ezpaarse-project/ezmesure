const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('config');
const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/depositors-template');
const depositors = require('../../services/depositors');
const { appLogger } = require('../../../server');
const { sendMail, generateMail } = require('../../services/mail');
const { sender, recipients } = config.get('notifications');

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

exports.getOne = async function (ctx) {
  indiciesExists();

  ctx.type = 'json';

  const { body } = await elastic.search({
    index: config.depositors.index,
    size: 1,
    ignoreUnavailable: true,
    body: {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: 'contacts',
                query: {
                  bool: {
                    must: [
                      {
                        term: {
                          'contacts.email': ctx.state.user.email,
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },
  });

  if (!body || !body.hits || !body.hits.hits) {
    throw new Error('invalid elastic response');
  }

  const establishment = body.hits.hits.map((hit) => {
    const depositor = hit._source;

    if (!depositor) {
      return {};
    }

    depositor.id = hit._id;

    if (!depositor.contacts.length) {
      depositor.contacts = {};
    }

    return depositor;
  });

  ctx.body = establishment;
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

exports.storeOrUpdate = async function (ctx) {
  indiciesExists();

  ctx.status = 200;

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

  const { form } = body;
  if (body && form) {
    const formData = JSON.parse(form);

    const currentDate = new Date();

    if (formData.organisation.uai) {
      try {
        const establisment = await getEtablishmentData(formData.organisation.uai);

        if (establisment) {
          formData.organisation.shortName = establisment.sigle;
          formData.organisation.city = establisment.commune;
          formData.organisation.establismentType = establisment.type_detablissement;
          formData.organisation.location.lon = establisment.longitude_x;
          formData.organisation.location.lat = establisment.latitude_y;
        }
      } catch (err) {
        appLogger.error('Failed to get establishment data', err);
      }
    }

    formData.organisation.logoUrl = logoId || '';
    formData.updatedAt = currentDate;

    if (formData.id) {
      const docId = formData.id;
      delete formData.id;

      return elastic.update({
        id: docId,
        index: config.depositors.index,
        body: {
          doc: formData,
        },
      })
      .then(async (res) => {
        await sendMail({
          from: sender,
          to: recipients,
          subject: 'Mise à jour formulaire établissement',
          ...generateMail('establishment', { }),
        });

        return res.body
      })
      .catch((err) => {
        ctx.status = 500;
        appLogger.error('Failed to update data in index', err);
      });
    }
    
    formData.organisation.establismentType = '';
    formData.organisation.city = '';
    formData.organisation.location = {
      lon: 0,
      lat: 0,
    };
    formData.organisation.domains = [];
    formData.auto = {
      ezmesure: false,
      ezpaarse: false,
      report: false,
    };
    formData.createdAt = currentDate;

    return elastic.index({
      index: config.depositors.index,
      body: formData,
    })
    .then(async (res) => {
      await sendMail({
        from: sender,
        to: recipients,
        subject: 'Création de données établissement',
        ...generateMail('establishment', { }),
      });

      return res.body
    })
    .catch((err) => {
      ctx.status = 500;
      appLogger.error('Failed to store data in index', err);
    });
  }
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
