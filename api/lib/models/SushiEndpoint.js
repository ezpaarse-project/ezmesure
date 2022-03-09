const { Joi } = require('koa-joi-router');
const { typedModel, registerModel, getModel } = require('./TypedModel');

const type = 'sushi-endpoint';

const schemas = {
  base: {
    id: Joi.string().trim(),
    institutionId: Joi.string().trim(),
    updatedAt: Joi.date(),
    createdAt: Joi.date(),

    validated: Joi.boolean().default(false),

    vendor: Joi.string().trim(),
    sushiUrl: Joi.string().trim(),
    description: Joi.string().trim().allow(''),
    technicalProvider: Joi.string().trim().allow(''),
    counterVersion: Joi.string().trim().regex(/^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/).empty(''),

    requireCustomerId: Joi.boolean().default(false),
    requireRequestorId: Joi.boolean().default(false),
    requireApiKey: Joi.boolean().default(false),
    isSushiCompliant: Joi.boolean().default(false),

    tags: Joi.array().items(Joi.string().trim()),

    params: Joi.array().items(Joi.object({
      name: Joi.string().trim().required(),
      value: Joi.string().trim().allow(''),
    })),
  },
};

schemas.adminCreate = {
  ...schemas.base,
  id: Joi.any().strip(),
  vendor: schemas.base.vendor.required(),
  sushiUrl: schemas.base.sushiUrl.required(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

schemas.adminUpdate = {
  ...schemas.adminCreate,
  vendor: schemas.base.vendor.optional(),
  sushiUrl: schemas.base.sushiUrl.optional(),
};

schemas.create = {
  ...schemas.adminCreate,
  validated: Joi.any().strip(),
};

schemas.update = {
  ...schemas.adminUpdate,
  institutionId: Joi.any().strip(),
  validated: Joi.any().strip(),
};

class SushiEndpoint extends typedModel({ type, schemas }) {
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
