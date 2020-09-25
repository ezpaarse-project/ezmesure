const { Joi } = require('koa-joi-router');
const encrypter = require('../services/encrypter');
const typedModel = require('./TypedModel');

const type = 'sushi';
const cryptedFields = ['requestorId', 'consortialId', 'customerId', 'apiKey'];

const schema = {
  id: Joi.string().trim().required(),
  institutionId: Joi.string().trim().required(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  vendor: Joi.string().trim().required(),
  package: Joi.string().trim().required(),
  sushiUrl: Joi.string().trim().required(),
  requestorId: Joi.string().trim().allow(''),
  consortialId: Joi.string().trim().allow(''),
  customerId: Joi.string().trim().allow(''),
  apiKey: Joi.string().trim().allow(''),
  comment: Joi.string().trim().allow(''),
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
};

module.exports = class Sushi extends typedModel(type, schema, createSchema, updateSchema) {
  toJSON() {
    const sushiItem = { id: this.id, ...this.data };

    return sushiItem;
  }

  static async findByInstitutionId(institutionId) {
    return this.findAll({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  static from(data = {}) {
    const d = data;
    cryptedFields.forEach((field) => {
      if (d[field]) {
        try {
          d[field] = encrypter.decrypt(d[field]);
        } catch (e) {
          this.logger.error(`Failed to decrypt sushi field "${field}" of ${data.id} : ${e.message}`);
        }
      }
    });
    return super.from(d);
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
};
