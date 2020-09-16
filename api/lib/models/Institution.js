const path = require('path');
const fs = require('fs-extra');
const config = require('config');
const sharp = require('sharp');
const { randomBytes } = require('crypto');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');

const index = config.get('depositors.index');
const logosDir = path.resolve(__dirname, '..', '..', 'uploads', 'logos');

const schema = {
  id: Joi.string().required(),
  validated: Joi.boolean().default(false),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  indexCount: Joi.number().default(0),
  indexPrefix: Joi.string().allow(''),

  type: Joi.string().allow(''),
  name: Joi.string().allow(''),
  acronym: Joi.string().allow(''),
  website: Joi.string().allow(''),
  city: Joi.string().allow(''),
  uai: Joi.string().allow(''),
  logoId: Joi.string().empty('').allow(null),

  domains: Joi.array().default([]).items(Joi.string()),
  members: Joi.array().default([]).items(Joi.object({
    username: Joi.string(),
    type: Joi.array().items(Joi.string()),
  })),
  auto: Joi.object({
    ezmesure: Joi.boolean().default(false),
    ezpaarse: Joi.boolean().default(false),
    report: Joi.boolean().default(false),
  }).default(),
};

const updateSchema = {
  ...schema,
  id: Joi.any().strip(),
  indexCount: Joi.any().strip(),
  validated: Joi.any().strip(),
  logoId: Joi.any().strip(),
  members: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

module.exports = class Institution {
  constructor(data, opt) {
    this.data = {};
    if (data) {
      this.update(data, opt);
    }
  }

  toJSON() {
    return { id: this.id, ...this.data };
  }

  static from(data) {
    return new Institution(data, { schema });
  }

  update(data = {}, opt = {}) {
    const validator = Joi.object(opt.schema || updateSchema);
    const { value, error } = validator.validate(data, { stripUnknown: true });
    if (error) { throw error; }

    if (data.id) {
      this.id = data.id;
    }

    this.data = { ...this.data, ...value };
    return this;
  }

  static async findById(id) {
    const { body, statusCode } = await elastic.getSource({ index, id }, { ignore: [404] });
    return body && statusCode !== 404 ? Institution.from({ id, ...body }) : undefined;
  }

  static async findByUsername(username) {
    const { body } = await elastic.search({
      index,
      size: 1,
      body: {
        query: {
          nested: {
            path: 'members',
            query: {
              bool: {
                filter: [
                  { term: { 'members.username': username } },
                ],
              },
            },
          },
        },
      },
    });

    const institution = body && body.hits && body.hits.hits && body.hits.hits[0];
    const { _source: source, _id: id } = institution || {};
    return source ? Institution.from({ id, ...source }) : undefined;
  }

  static async findByDomain(domain) {
    const { body } = await elastic.search({
      index,
      size: 100,
      body: {
        query: {
          bool: {
            filter: [
              { term: { domains: domain } },
            ],
          },
        },
      },
    });

    const institution = body && body.hits && body.hits.hits && body.hits.hits[0];
    const { _source: source, _id: id } = institution || {};
    return source ? Institution.from({ id, ...source }) : undefined;
  }

  static async findAllValidated() {
    // FIXME: prefer scrolling
    const { body } = await elastic.search({
      index,
      size: 1000,
      body: {
        query: {
          bool: {
            filter: [
              { term: { validated: true } },
            ],
          },
        },
      },
    });

    const institutions = body && body.hits && body.hits.hits;

    if (!Array.isArray(institutions)) {
      return Promise.reject(new Error('failed to fetch institutions'));
    }

    return institutions.map(({ _source: source, _id: id }) => Institution.from({ id, ...source }));
  }

  static async findAll() {
    // FIXME: prefer scrolling
    const { body } = await elastic.search({ index, size: 1000, ignoreUnavailable: true });

    if (!Array.isArray(body && body.hits && body.hits.hits)) {
      throw new Error('invalid elastic response');
    }


    const institutions = body.hits.hits.map((hit) => {
      const { _source: institution, _id: id } = hit;
      return institution && Institution.from({ id, ...institution });
    });

    return institutions.filter((i) => i);
  }

  static async findAndSetValidation(id, validated) {
    return elastic.update({
      index,
      id,
      body: {
        doc: { validated },
      },
    });
  }

  addMember(username, type = []) {
    if (!Array.isArray(this.data.members)) {
      this.data.members = [];
    }
    this.data.members.push({ username, type });
  }

  hasMember(username) {
    const { members } = this.data;
    return Array.isArray(members) ? members.some((m) => m.username === username) : false;
  }

  logoPath() {
    const { logoId } = this.data;
    return logoId && path.resolve(logosDir, logoId);
  }

  async removeLogo() {
    if (this.data.logoId) {
      await fs.remove(path.resolve(logosDir, this.data.logoId));
      this.data.logoId = undefined;
    }
  }

  async updateLogo(base64logo) {
    const logoId = `${randomBytes(16).toString('hex')}.png`;
    const logoPath = path.resolve(logosDir, logoId);
    const logoContent = Buffer.from(base64logo, 'base64');

    await fs.ensureDir(logosDir);
    await sharp(logoContent)
      .resize({
        width: 600,
        height: 200,
        fit: sharp.fit.inside,
      })
      .toFormat('png')
      .toFile(logoPath);

    await this.removeLogo();

    this.data.logoId = logoId;
  }

  async save() {
    const now = new Date();

    if (this.id) {
      this.data.updatedAt = new Date();

      await elastic.index({
        index,
        id: this.id,
        refresh: true,
        body: this.data,
      }).catch((e) => Promise.reject(new Error(e)));
    } else {
      this.data.updatedAt = now;
      this.data.createdAt = now;

      const { _id: id } = await elastic.index({
        index,
        refresh: true,
        body: this.data,
      }).catch((e) => {
        return Promise.reject(new Error(e));
      });

      this.id = id;
    }
  }
};
