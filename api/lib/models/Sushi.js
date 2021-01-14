const { Joi } = require('koa-joi-router');
const format = require('date-fns/format');
const subMonths = require('date-fns/subMonths');
const encrypter = require('../services/encrypter');
const sushiService = require('../services/sushi');
const { typedModel, registerModel, getModel } = require('./TypedModel');

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
};

class Sushi extends typedModel(type, schema, createSchema, updateSchema) {
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

  getReport() {
    if (!this.data.sushiUrl) {
      throw new Error('sushiUrl not set');
    }

    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

    const params = {};
    if (Array.isArray(this.data.params)) {
      this.data.params.forEach((param) => {
        if (param) { params[param.name] = param.value; }
      });
    }

    return sushiService.getReport(this.data.sushiUrl, {
      requestorId: this.data.requestorId,
      customerId: this.data.customerId,
      apiKey: this.data.apiKey,
      beginDate: prevMonth,
      endDate: prevMonth,
      params,
    });
  }
}

registerModel(Sushi);
module.exports = Sushi;
