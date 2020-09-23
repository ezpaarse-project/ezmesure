const path = require('path');
const fs = require('fs-extra');
const config = require('config');
const sharp = require('sharp');
const { randomBytes } = require('crypto');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');
const typedModel = require('./TypedModel');

const index = config.get('depositors.index');
const type = 'institution';
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

const createSchema = {
  ...schema,
  id: Joi.any().strip(),
  indexCount: Joi.any().strip(),
  indexPrefix: Joi.any().strip(),
  validated: Joi.any().strip(),
  logoId: Joi.any().strip(),
  members: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

const updateSchema = {
  ...createSchema,
};

module.exports = class Institution extends typedModel(type, schema, createSchema, updateSchema) {
  static findByUsername(username) {
    return this.findOne({
      filters: [{
        nested: {
          path: `${type}.members`,
          query: {
            bool: {
              filter: [{ term: { [`${type}.members.username`]: username } }],
            },
          },
        },
      }],
    });
  }

  static findByDomain(domain) {
    return this.findAll({
      filters: [
        { term: { [`${type}.domains`]: domain } },
      ],
    });
  }

  static findAllValidated() {
    return this.findAll({
      filters: [
        { term: { [`${type}.validated`]: true } },
      ],
    });
  }

  static findAndSetValidation(id, validated) {
    return elastic.update({
      index,
      id: Institution.generateId(id),
      refresh: true,
      body: {
        doc: { [type]: { validated } },
      },
    }).catch((e) => Promise.reject(new Error(e)));
  }

  addMember(username, memberType = []) {
    if (!Array.isArray(this.data.members)) {
      this.data.members = [];
    }
    this.data.members.push({ username, type: memberType });
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
};
