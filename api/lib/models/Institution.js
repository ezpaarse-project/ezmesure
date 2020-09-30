const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const { randomBytes } = require('crypto');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');
const { registerModel, typedModel, getModel } = require('./TypedModel');

const type = 'institution';
const techRole = 'tech-contact';
const docRole = 'doc-contact';
const logosDir = path.resolve(__dirname, '..', '..', 'uploads', 'logos');

const schema = {
  id: Joi.string(),
  validated: Joi.boolean().default(false),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  indexCount: Joi.number().default(0),
  indexPrefix: Joi.string().allow(''),

  creator: Joi.string().allow('').allow(null),
  role: Joi.string().allow('').allow(null),

  type: Joi.string().allow(''),
  name: Joi.string().allow(''),
  acronym: Joi.string().allow(''),
  website: Joi.string().allow(''),
  city: Joi.string().allow(''),
  uai: Joi.string().allow(''),
  logoId: Joi.string().empty('').allow(null),

  domains: Joi.array().default([]).items(Joi.string()),
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
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

const updateSchema = {
  ...createSchema,
};

async function createRole(role, settings = {}) {
  const { body } = await elastic.security.getRole({ name: role }, { ignore: [404] });
  const existingRole = body && body[role];

  if (existingRole) { return; }

  await elastic.security.putRole({
    name: role,
    refresh: true,
    body: settings,
  }, { ignore: [404] });
}

class Institution extends typedModel(type, schema, createSchema, updateSchema) {
  static findOneByCreatorOrRole(username, roles) {
    return this.findOne({
      should: [
        { bool: { filter: { terms: { [`${type}.role`]: roles } } } },
        { bool: { filter: { term: { [`${type}.creator`]: username } } } },
      ],
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

  static async deleteOne(rawId) {
    await super.deleteOne(rawId);
    return getModel('sushi').deleteByInstitutionId(rawId);
  }

  isValidated() {
    return !!this.data.validated;
  }

  setValidation(validated) {
    this.data.validated = validated;
  }

  setCreator(username) {
    this.data.creator = username;
  }

  isContact(user) {
    const { creator, role } = this.data;

    if (!user || !user.username) { return false; }
    if (creator && creator === user.username) { return true; }
    if (!role || !Array.isArray(user && user.roles)) { return false; }

    const roles = new Set(user.roles);
    return roles.has(role) && (roles.has(techRole) || roles.has(docRole));
  }

  /**
   * Create the associated role if it doesn't exist
   */
  async createRole() {
    const { role, indexPrefix } = this.data;

    if (!role) {
      throw new Error('institution has no role associated');
    }
    if (!indexPrefix) {
      throw new Error('institution has no index prefix associated');
    }

    await createRole(techRole);
    await createRole(docRole);
    await createRole(role, {
      indices: [{
        names: [`${indexPrefix}*`],
        privileges: ['all'],
      }],
    });
  }

  async migrateCreator() {
    const { creator, role } = this.data;
    if (!creator || !role) { return; }

    const { body = {} } = await elastic.security.getUser({ username: creator }, { ignore: [404] });
    const user = body[creator];

    if (!user) {
      throw new Error('no user matching institution creator');
    }

    user.roles = Array.isArray(user.roles) ? user.roles : [];

    const roles = [role, techRole, docRole];
    const hasAllRoles = roles.every((r) => user.roles.includes(r));

    if (!hasAllRoles) {
      user.roles = Array.from(new Set(roles.concat(user.roles)));
      await elastic.security.putUser({ username: creator, refresh: true, body: user });
    }

    this.data.creator = null;
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
}

registerModel(Institution);
module.exports = Institution;
