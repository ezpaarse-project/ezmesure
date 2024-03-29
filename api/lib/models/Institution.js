const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const { randomBytes } = require('crypto');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');
const kibana = require('../services/kibana');
const indexTemplate = require('../utils/index-template');
const { registerModel, typedModel, getModel } = require('./TypedModel');

const type = 'institution';
const techRole = 'tech_contact';
const docRole = 'doc_contact';
const readOnlySuffix = '_read_only';

const logosDir = path.resolve(__dirname, '..', '..', 'uploads', 'logos');

const schemas = {
  base: {
    id: Joi.string(),
    validated: Joi.boolean(),
    updatedAt: Joi.date(),
    createdAt: Joi.date(),

    indexCount: Joi.number(),
    indexPrefix: Joi.string().regex(/^[a-z0-9][a-z0-9_.-]*$/).allow(''),

    creator: Joi.string().allow('').allow(null),
    role: Joi.string().allow('').allow(null),
    space: Joi.string().allow('').allow(null),
    hidePartner: Joi.boolean(),

    techContactName: Joi.string().allow('').allow(null),
    docContactName: Joi.string().allow('').allow(null),

    type: Joi.string().allow(''),
    name: Joi.string().allow(''),
    acronym: Joi.string().allow(''),
    website: Joi.string().allow(''),
    city: Joi.string().allow(''),
    uai: Joi.string().allow(''),
    logoId: Joi.string().empty('').allow(null),

    twitterUrl: Joi.string().allow(''),
    linkedinUrl: Joi.string().allow(''),
    youtubeUrl: Joi.string().allow(''),
    facebookUrl: Joi.string().allow(''),

    sushiReadySince: Joi.date().allow(null),

    domains: Joi.array().items(Joi.string()),
    auto: Joi.object({
      ezmesure: Joi.boolean(),
      ezpaarse: Joi.boolean(),
      report: Joi.boolean(),
      sushi: Joi.boolean(),
    }),
  },
};

const immutableFields = {
  id: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

schemas.adminCreate = {
  ...schemas.base,
  ...immutableFields,

  validated: schemas.base.validated.default(false),
  indexCount: schemas.base.indexCount.default(0),
  hidePartner: schemas.base.hidePartner.default(false),

  auto: Joi.object({
    ezmesure: Joi.boolean().default(false),
    ezpaarse: Joi.boolean().default(false),
    report: Joi.boolean().default(false),
    sushi: Joi.boolean().default(false),
  }).default(),
};

schemas.adminUpdate = {
  ...schemas.base,
  ...immutableFields,
};

schemas.create = {
  ...schemas.base,
  ...immutableFields,

  validated: Joi.any().strip(),

  indexCount: Joi.any().strip(),
  indexPrefix: Joi.any().strip(),

  creator: Joi.any().strip(),
  role: Joi.any().strip(),
  space: Joi.any().strip(),
  hidePartner: Joi.any().strip(),

  techContactName: Joi.any().strip(),
  docContactName: Joi.any().strip(),

  logoId: Joi.any().strip(),
};

schemas.update = {
  ...schemas.create,
};

async function getRole(role) {
  const { body } = await elastic.security.getRole({ name: role }, { ignore: [404] });
  return body && body[role];
}

/**
 * Create a role with given settings
 * @param {String} role the role to create
 * @param {Object} settings role settings
 * @returns {Boolean} true if the role has been created, false if it already exists
 */
async function createRole(role, settings = {}) {
  if (await getRole(role)) {
    return { created: false };
  }

  await kibana.putRole({
    name: role,
    body: settings,
  }, { ignore: [404] });

  return { created: true };
}

/**
 * Remove the readonly suffix from a string
 * @param {String} str the string to trim
 */
function trimReadOnlySuffix(str) {
  if (typeof str !== 'string') { return ''; }
  if (str.endsWith(readOnlySuffix)) {
    return str.substring(0, str.length - readOnlySuffix.length);
  }
  return str;
}

/**
 * Add the readonly suffix to a string
 * @param {String} str the string to change
 */
function addReadOnlySuffix(str) {
  return `${str || ''}${readOnlySuffix}`;
}

class Institution extends typedModel({ type, schemas }) {
  static docRole() { return docRole; }

  static techRole() { return techRole; }

  static findOneByCreatorOrRole(username, userRoles) {
    // Remove readonly suffix so that we search with the base role
    const roles = Array.isArray(userRoles) ? userRoles.map(trimReadOnlySuffix) : [];

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
      must_not: [
        { term: { [`${type}.hidePartner`]: true } },
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

  getRole(opts = {}) {
    const role = this.get('role');

    if (role) {
      const readonly = opts && opts.readonly;
      return readonly ? addReadOnlySuffix(role) : role;
    }

    return null;
  }

  isCreator(user) {
    if (!user || !user.username) { return false; }
    const { creator } = this.data;

    return (creator && creator === user.username);
  }

  isContact(user) {
    if (!this.isMember(user)) { return false; }
    if (!Array.isArray(user && user.roles)) { return false; }

    const roles = new Set(user.roles);
    return (roles.has(techRole) || roles.has(docRole));
  }

  isMember(user) {
    if (!user || !user.username) { return false; }

    const { role } = this.data;
    const readOnlyRole = addReadOnlySuffix(role);

    if (!role || !Array.isArray(user && user.roles)) { return false; }

    const roles = new Set(user.roles);
    return (roles.has(role) || roles.has(readOnlyRole));
  }

  async getMembers() {
    const { role, creator } = this.data;

    if (!role && !creator) { return []; }

    const should = [];

    if (role) {
      should.push({ terms: { roles: [role, addReadOnlySuffix(role)] } });
    }
    if (creator) {
      should.push({ term: { username: creator } });
    }

    const { body = {} } = await elastic.search({
      index: '.security',
      _source: ['full_name', 'roles', 'username'],
      body: {
        size: 1000,
        query: {
          bool: {
            should,
            minimum_should_match: 1,
          },
        },
      },
    });

    let members = body.hits && body.hits.hits;

    if (!Array.isArray(members)) {
      members = [];
    }

    return members.map(({ _source: source }) => {
      const userRoles = new Set(Array.isArray(source.roles) ? source.roles : []);

      return {
        ...source,
        readonly: !userRoles.has(role),
        docContact: userRoles.has(Institution.docRole()),
        techContact: userRoles.has(Institution.techRole()),
        creator: creator && (source.username === creator),
      };
    });
  }

  async getContacts() {
    const role = await this.getRole();
    if (!role) return [];

    const { body = {} } = await elastic.search({
      index: '.security',
      body: {
        query: {
          bool: {
            filter: [
              { term: { type: 'user' } },
              { terms: { roles: [role, addReadOnlySuffix(role)] } },
              { terms: { roles: ['doc_contact', 'tech_contact'] } },
            ],
          },
        },
      },
    });

    let contacts = body.hits && body.hits.hits;

    if (!Array.isArray(contacts)) {
      contacts = [];
    }

    return contacts.map(({ _source: source }) => ({
      ...source,
    }));
  }

  /**
   * Get the institution space
   */
  async getSpace(id) {
    const { space } = this.data;

    if (typeof space !== 'string' || space.length === 0) {
      return null;
    }

    const { data = {}, status } = await kibana.getSpace(id || space);

    return status === 200 ? data : null;
  }

  /**
   * Get all institution spaces
   */
  async getSpaces() {
    const { space } = this.data;

    if (typeof space !== 'string' || space.length === 0) {
      return [];
    }

    const { data = [], status } = await kibana.getSpaces();

    if (status !== 200 || !Array.isArray(data)) { return []; }

    return data.filter((s) => s && typeof s.id === 'string' && s.id.startsWith(space));
  }

  /**
   * Create the institution space if it doesn't exist yet
   */
  async createSpace(opts) {
    const {
      id,
      name,
      description,
      initials,
      color,
    } = opts || {};
    const { space, name: institutionName } = this.data;

    const spaceId = id || space;

    const { data: existingSpace, status } = await kibana.getSpace(spaceId);

    if (status === 200 && existingSpace) {
      return existingSpace;
    }

    const { data } = await kibana.createSpace({
      id: spaceId,
      name: name || spaceId,
      description: description || institutionName,
      initials,
      color,
    });
    return data;
  }

  /**
   * Check that the institution roles exist
   */
  async checkRoles() {
    const { role } = this.data;

    return {
      base: {
        name: role,
        exists: !!role && !!await getRole(role),
      },
      readonly: {
        name: role && addReadOnlySuffix(role),
        exists: !!role && !!await getRole(addReadOnlySuffix(role)),
      },
    };
  }

  /**
   * Create all necessary roles if they don't exist
   */
  async createRoles() {
    const { role, indexPrefix, space } = this.data;

    if (!role) {
      throw new Error('institution has no role associated');
    }
    if (!indexPrefix) {
      throw new Error('institution has no index prefix associated');
    }
    if (!space) {
      throw new Error('institution has no space associated');
    }

    return [
      {
        name: techRole,
        ...await createRole(techRole),
      },
      {
        name: docRole,
        ...await createRole(docRole),
      },
      {
        name: role,
        ...await createRole(role, {
          elasticsearch: {
            indices: [{
              names: [`${indexPrefix}*`],
              privileges: ['all'],
            }],
          },
          kibana: [{
            base: ['all'],
            spaces: [space],
          }],
        }),
      },
      {
        name: addReadOnlySuffix(role),
        ...await createRole(addReadOnlySuffix(role), {
          elasticsearch: {
            indices: [{
              names: [`${indexPrefix}*`],
              privileges: ['read'],
            }],
          },
          kibana: [{
            base: ['read'],
            spaces: [space],
          }],
        }),
      },
    ];
  }

  /**
   * Get the index patterns of the institution
   */
  async getIndexPatterns(opts) {
    const { suffix } = opts || {};
    const { space, indexPrefix } = this.data;

    if (!space || (suffix && !indexPrefix)) {
      return [];
    }

    const { data } = await kibana.findObjects({
      spaceId: space,
      type: 'index-pattern',
      perPage: 1000,
    });
    let patterns = data && data.saved_objects;

    if (!Array.isArray(patterns)) {
      patterns = [];
    }

    if (suffix) {
      patterns = patterns.filter((obj) => {
        const title = obj && obj.attributes && obj.attributes.title;
        return title === `${indexPrefix}${suffix}`;
      });
    }

    return patterns.map((obj) => {
      const { id, updatedAt, attributes } = obj || {};
      const { title, timeFieldName } = attributes || {};

      return {
        id,
        updatedAt,
        title,
        timeFieldName,
      };
    });
  }

  /**
   * Get the indices of the institution
   */
  async getIndices() {
    const { indexPrefix } = this.data;

    if (!indexPrefix) {
      return [];
    }

    const { body } = await elastic.indices.get({ index: `${indexPrefix}*`, allowNoIndices: true });

    return Object.keys(body);
  }

  /**
   * Create an index matching the prefix
   */
  async createBaseIndex() {
    const { indexPrefix: index } = this.data;

    if (!index) {
      throw new Error('institution has no index prefix associated');
    }

    const { body: exists } = await elastic.indices.exists({ index });

    if (!exists) {
      await elastic.indices.create({
        index,
        body: indexTemplate,
      });
    }
  }

  /**
   * Refresh indexCount by counting everything with the institution prefix
   *
   * @return {Boolean} true if a change has been saved, false otherwise
   * @memberof Institution
   */
  async refreshIndexCount() {
    const { indexPrefix } = this.data;
    if (!indexPrefix) { return false; }

    const { body = {} } = await elastic.count({ index: `${indexPrefix}*` });

    if (!Number.isNaN(body.count) && this.get('indexCount') !== body.count) {
      this.data.indexCount = body.count;
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Refresh contact names by looking for members with either of doc or tech role
   *
   * @return {Boolean} true if a change has been saved, false otherwise
   */
  async refreshContacts() {
    const { role } = this.data;
    if (!role) { return false; }

    const { body = {} } = await elastic.search({
      index: '.security',
      _source: ['full_name', 'roles'],
      body: {
        query: {
          bool: {
            filter: [
              { terms: { roles: [techRole, docRole] } },
              { terms: { roles: [role, addReadOnlySuffix(role)] } },
            ],
          },
        },
      },
    });

    const users = body.hits && body.hits.hits;
    let docName = '';
    let techName = '';

    if (!Array.isArray(users)) {
      return false;
    }

    users.forEach((u) => {
      const { _source: user } = u;
      if (!Array.isArray(user && user.roles)) { return; }

      if (!docName && user.roles.includes(docRole)) {
        docName = user.full_name;
      }

      if (!techName && user.roles.includes(techRole)) {
        techName = user.full_name;
      }
    });

    const techChanged = this.get('techContactName', '') !== techName;
    const docChanged = this.get('docContactName', '') !== docName;

    if (techChanged || docChanged) {
      this.data.docContactName = docName;
      this.data.techContactName = techName;
      await this.save();
      return true;
    }

    return false;
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
