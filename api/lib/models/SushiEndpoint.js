const { Joi } = require('koa-joi-router');
const { typedModel, registerModel, getModel } = require('./TypedModel');

const type = 'sushi-endpoint';

const schema = {
  id: Joi.string().trim().required(),
  institutionId: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  vendor: Joi.string().trim().required(),
  sushiUrl: Joi.string().trim().required(),
  description: Joi.string().trim().allow(''),
  companies: Joi.string().trim().allow(''),
  counterVersion: Joi.string().trim().regex(/^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/).empty(''),

  requireCustomerId: Joi.boolean().default(false),
  requireRequestorId: Joi.boolean().default(false),
  requireApiKey: Joi.boolean().default(false),
  isSushiCompliant: Joi.boolean().default(false),

  tags: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    color: Joi.string().trim().regex(/^#([a-f0-9]{6}|[a-f0-9]{3})$/i).empty(''),
  })),

  params: Joi.array().items(Joi.object({
    name: Joi.string().trim().required(),
    value: Joi.string().trim().allow(''),
  })),
};

const createSchema = {
  ...schema,
  id: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

const updateSchema = {
  ...createSchema,
  institutionId: Joi.any().strip(),
  vendor: schema.vendor.optional(),
  sushiUrl: schema.sushiUrl.optional(),
};

class SushiEndpoint extends typedModel(type, schema, createSchema, updateSchema) {
  static async findByInstitutionId(institutionId, opts) {
    const options = opts || {};

    options.filters = Array.isArray(opts?.filters) ? opts.filters : [];
    options.filters.push({ term: { [`${type}.institutionId`]: institutionId } });

    return this.findAll(options);
  }

  static deleteByInstitutionId(institutionId) {
    this.deleteByQuery({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  getInstitution() {
    if (!this.data?.institutionId) { return null; }
    return getModel('institution').findById(this.data.institutionId);
  }
}

registerModel(SushiEndpoint);
module.exports = SushiEndpoint;
