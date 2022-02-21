const config = require('config');
const uuid = require('uuid');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');
const { appLogger } = require('../services/logger');

const index = config.get('depositors.index');
const models = new Map();

const registerModel = (model) => {
  appLogger.verbose(`Registering model ${model?.type}`);
  models.set(model.type, model);
};
const getModel = (type) => models.get(type);

const typedModel = ({ type, schemas }) => class TypedModel {
  static get index() { return index; }

  static get type() { return type; }

  static get schemas() { return schemas; }

  static get logger() { return appLogger; }

  constructor(data, opt = {}) {
    this.data = {};

    if (data) {
      this.update(data, { schema: 'create', ...opt });
    }
  }

  toJSON() {
    return { id: this.id, ...this.data };
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getData() {
    return this.data || {};
  }

  get(prop, defaultValue) {
    const value = this.data[prop];
    return (typeof value === 'undefined' ? defaultValue : value);
  }

  set(prop, value) {
    this.data[prop] = value;
  }

  static getSchema(name) {
    return schemas[name];
  }

  static trimIdPrefix(id) {
    return id.startsWith(`${type}:`) ? id.slice(type.length + 1) : id;
  }

  static generateId(id) {
    return `${type}:${id || uuid.v1()}`;
  }

  static from(data) {
    return new this(data, { schema: 'base' });
  }

  update(data = {}, opt = {}) {
    const validator = Joi.object(schemas[opt.schema] || schemas.update);
    const { value, error } = validator.validate(data, { stripUnknown: true });
    if (error) { throw error; }

    if (data.id) {
      this.id = TypedModel.trimIdPrefix(data.id);
    }
    if (value.id) {
      value.id = TypedModel.trimIdPrefix(value.id);
    }

    this.data = { ...this.data, ...value };
    return this;
  }

  static deleteOne(rawId) {
    return elastic.delete({
      id: TypedModel.generateId(rawId),
      index,
      refresh: true,
    });
  }

  delete() {
    return this.id && elastic.delete({
      id: TypedModel.generateId(this.id),
      index,
      refresh: true,
    }).catch((e) => Promise.reject(new Error(e)));
  }

  static deleteByQuery(opt = {}) {
    let filter = [{ term: { type } }];

    if (Array.isArray(opt.filters)) {
      filter = [...filter, ...opt.filters];
    }

    return elastic.deleteByQuery({
      index,
      refresh: true,
      body: {
        query: {
          bool: { filter },
        },
      },
    });
  }

  static updateByQuery(opt = {}) {
    const { script, params } = opt || {};
    if (!script) { return Promise.resolve(); }

    let filter = [{ term: { type } }];

    if (Array.isArray(opt.filters)) {
      filter = [...filter, ...opt.filters];
    }

    return elastic.updateByQuery({
      index,
      refresh: true,
      body: {
        query: {
          bool: { filter },
        },
        script,
        params,
      },
    });
  }

  static async updateById(rawId, doc = {}) {
    const id = TypedModel.generateId(rawId);

    return elastic.update({
      index,
      id,
      body: { doc },
    }, {
      ignore: [404],
    });
  }

  static async findById(rawId) {
    const id = TypedModel.generateId(rawId);
    const { body, statusCode } = await elastic.getSource({ index, id }, { ignore: [404] });

    if (body && body[type] && statusCode !== 404) {
      return this.from({ id, ...body[type] });
    }
    return undefined;
  }

  static async findManyById(rawIds) {
    const ids = rawIds.map((rawId) => TypedModel.generateId(rawId));

    const { body } = await elastic.search({
      index,
      body: {
        size: ids.length,
        query: { ids: { values: ids } },
      },
    }, { ignore: [404] }).catch((e) => Promise.reject(new Error(e)));

    if (!Array.isArray(body && body.hits && body.hits.hits)) {
      throw new Error('invalid elastic response');
    }

    const items = body.hits.hits.map((hit) => {
      const { _source: source, _id: id } = hit;
      return (source && source[type]) && this.from({ id, ...source[type] });
    });

    return items.filter((i) => i);
  }

  static async findOne(opt = {}) {
    const items = await this.findAll({ ...opt, size: 1 });
    return items[0];
  }

  static async findAll(opt = {}) {
    const sort = opt.sort || [{
      [`${type}.createdAt`]: 'desc',
    }];

    let filter = [{ term: { type } }];

    if (Array.isArray(opt.filters)) {
      filter = [...filter, ...opt.filters];
    }

    // FIXME: prefer scrolling
    const { body } = await elastic.search({
      index: this.index,
      size: opt.size || 1000,
      ignoreUnavailable: true,
      body: {
        sort,
        collapse: opt.collapse,
        query: {
          bool: {
            minimum_should_match: opt.should ? 1 : 0,
            should: opt.should,
            must_not: opt.must_not,
            filter,
          },
        },
      },
    });

    if (!Array.isArray(body && body.hits && body.hits.hits)) {
      throw new Error('invalid elastic response');
    }

    const items = body.hits.hits.map((hit) => {
      const { _source: source, _id: id } = hit;
      return (source && source[type]) && this.from({ id, ...source[type] });
    });

    return items.filter((i) => i);
  }

  static filterBy(prop, value) {
    return {
      [Array.isArray(value) ? 'terms' : 'term']: { [`${type}.${prop}`]: value },
    };
  }

  static filterById(id) {
    let value;

    if (Array.isArray(id)) {
      value = id.map((i) => TypedModel.generateId(i));
    } else {
      value = TypedModel.generateId(id);
    }

    return {
      [Array.isArray(value) ? 'terms' : 'term']: { _id: value },
    };
  }

  async save() {
    const now = new Date();

    const preSave = typeof this.constructor.preSave === 'function' ? this.constructor.preSave : (x) => x;

    if (this.id) {
      this.data.updatedAt = new Date();
      this.data.createdAt = this.data.createdAt || new Date();

      await elastic.index({
        index,
        id: TypedModel.generateId(this.id),
        refresh: true,
        body: { type, [type]: preSave(this.data) },
      }).catch((e) => Promise.reject(new Error(e)));
    } else {
      this.data.updatedAt = now;
      this.data.createdAt = now;

      const { body } = await elastic.index({
        index,
        id: TypedModel.generateId(),
        refresh: true,
        body: { type, [type]: preSave(this.data) },
      }).catch((e) => Promise.reject(new Error(e)));

      const { _id: id } = body || {};

      if (typeof id === 'string') {
        this.id = TypedModel.trimIdPrefix(id);
      }
    }
  }
};

module.exports = {
  registerModel,
  getModel,
  typedModel,
};
