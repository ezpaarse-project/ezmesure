const config = require('config');
const uuid = require('uuid');
const { Joi } = require('koa-joi-router');
const elastic = require('../services/elastic');
const { appLogger } = require('../../server');

const index = config.get('depositors.index');
const models = new Map();

const registerModel = (model) => models.set(model.type, model);
const getModel = (type) => models.get(type);

const typedModel = (type, schema, createSchema, updateSchema) => class TypedModel {
  static get index() { return index; }

  static get type() { return type; }

  static get schema() { return schema; }

  static get createSchema() { return createSchema; }

  static get updateSchema() { return updateSchema; }

  static get logger() { return appLogger; }

  constructor(data, opt = {}) {
    this.data = {};

    if (data) {
      this.update(data, { schema: createSchema, ...opt });
    }
  }

  toJSON() {
    return { id: this.id, ...this.data };
  }

  getId() {
    return this.id;
  }

  getData() {
    return this.data || {};
  }

  static trimIdPrefix(id) {
    return id.startsWith(`${type}:`) ? id.slice(type.length + 1) : id;
  }

  static generateId(id) {
    return `${type}:${id || uuid.v1()}`;
  }

  static from(data) {
    return new this(data, { schema });
  }

  update(data = {}, opt = {}) {
    const validator = Joi.object(opt.schema || updateSchema);
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
        query: {
          bool: {
            minimum_should_match: opt.should ? 1 : 0,
            should: opt.should,
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

  async save() {
    const now = new Date();

    const preSave = typeof this.constructor.preSave === 'function' ? this.constructor.preSave : (x) => x;

    if (this.id) {
      this.data.updatedAt = new Date();

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
