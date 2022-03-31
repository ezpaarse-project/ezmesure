const { Joi } = require('koa-joi-router');
const encrypter = require('../services/encrypter');
const { typedModel, registerModel, getModel } = require('./TypedModel');
const { appLogger } = require('../services/logger');

const type = 'sushi';
const cryptedFields = ['requestorId', 'consortialId', 'customerId', 'apiKey'];

const schemas = {
  base: {
    id: Joi.string().trim(),
    endpointId: Joi.string().trim(),
    institutionId: Joi.string().trim(),
    updatedAt: Joi.date(),
    createdAt: Joi.date(),

    vendor: Joi.string().trim().allow(''),
    package: Joi.string().trim(),
    requestorId: Joi.string().trim().allow(''),
    consortialId: Joi.string().trim().allow(''),
    customerId: Joi.string().trim().allow(''),
    apiKey: Joi.string().trim().allow(''),
    comment: Joi.string().trim().allow(''),

    ignoreReportValidation: Joi.boolean(),

    connection: Joi.object({
      success: Joi.boolean(),
      date: Joi.date(),
      exceptions: Joi.array().items(Joi.string()),
    }),
    latestImportTask: Joi.object(),

    params: Joi.array().items(Joi.object({
      name: Joi.string().trim().required(),
      value: Joi.string().trim().allow(''),
    })),
  },
};

schemas.adminCreate = {
  ...schemas.base,
  id: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
  latestImportTask: Joi.any().strip(),

  endpointId: schemas.base.endpointId.required(),
  institutionId: schemas.base.institutionId.required(),
  package: schemas.base.package.required(),
};

schemas.adminUpdate = {
  ...schemas.adminCreate,
  endpointId: schemas.base.endpointId.optional(),
  institutionId: schemas.base.institutionId.optional(),
  package: schemas.base.package.optional(),
};

schemas.create = {
  ...schemas.adminCreate,
};

schemas.update = {
  ...schemas.create,
  institutionId: Joi.any().strip(),
  package: schemas.base.package.optional(),
};

class Sushi extends typedModel({ type, schemas }) {
  static async findByInstitutionId(institutionId, opts) {
    const options = opts || {};

    options.filters = Array.isArray(opts?.filters) ? opts.filters : [];
    options.filters.push({ term: { [`${type}.institutionId`]: institutionId } });

    return this.findAll(options);
  }

  static from(data = {}) {
    const d = data;
    cryptedFields.forEach((field) => {
      if (d[field]) {
        try {
          d[field] = encrypter.decrypt(d[field]);
        } catch (e) {
          appLogger.error(`Failed to decrypt sushi field "${field}" of ${data.id} : ${e.message}`);
        }
      }
    });
    return super.from(d);
  }

  static deleteByInstitutionId(institutionId) {
    this.deleteByQuery({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  getInstitutionId() {
    return this.data && this.data.institutionId;
  }

  getPackage() {
    return this.data && this.data.package;
  }

  getInstitution() {
    if (!this.data.institutionId) { return null; }
    return getModel('institution').findById(this.data.institutionId);
  }

  static preSave(data) {
    const savedData = { ...data };

    cryptedFields.forEach((field) => {
      if (savedData[field]) {
        savedData[field] = encrypter.encrypt(savedData[field]);
      }
    });

    return savedData;
  }
}

registerModel(Sushi);
module.exports = Sushi;
