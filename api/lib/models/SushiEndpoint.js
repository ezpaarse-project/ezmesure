const { Joi } = require('koa-joi-router');
const { typedModel, registerModel, getModel } = require('./TypedModel');

const type = 'sushi-endpoint';

const schemas = {
  base: {
    id: Joi.string().trim(),
    institutionId: Joi.string().trim(),
    updatedAt: Joi.date(),
    createdAt: Joi.date(),

    validated: Joi.boolean(),

    vendor: Joi.string().trim(),
    sushiUrl: Joi.string().trim(),
    description: Joi.string().trim().allow(''),
    technicalProvider: Joi.string().trim().allow(''),
    counterVersion: Joi.string().trim().regex(/^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/).empty(''),

    ignoreReportValidation: Joi.boolean(),

    requireCustomerId: Joi.boolean(),
    requireRequestorId: Joi.boolean(),
    requireApiKey: Joi.boolean(),
    isSushiCompliant: Joi.boolean(),

    tags: Joi.array().items(Joi.string().trim()),

    params: Joi.array().items(Joi.object({
      name: Joi.string().trim().required(),
      value: Joi.string().trim().allow(''),
    })),
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
  requireCustomerId: schemas.base.requireCustomerId.default(false),
  requireRequestorId: schemas.base.requireRequestorId.default(false),
  requireApiKey: schemas.base.requireApiKey.default(false),
  isSushiCompliant: schemas.base.isSushiCompliant.default(false),

  vendor: schemas.base.vendor.required(),
  sushiUrl: schemas.base.sushiUrl.required(),
};

schemas.adminUpdate = {
  ...schemas.base,
  ...immutableFields,
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
