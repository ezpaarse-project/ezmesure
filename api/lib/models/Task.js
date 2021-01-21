const { Joi } = require('koa-joi-router');
const { typedModel, registerModel, getModel } = require('./TypedModel');

const type = 'task';

const schema = {
  id: Joi.string().trim().required(),
  sushiId: Joi.string().trim().required(),
  institutionId: Joi.string().trim().required(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  status: Joi.string(),
  runningTime: Joi.number(),

  logs: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    type: Joi.string().trim(),
    message: Joi.string().trim(),
  })),

  result: Joi.object(),
};

const createSchema = {
  ...schema,
  id: Joi.any().strip(),
  updatedAt: Joi.any().strip(),
  createdAt: Joi.any().strip(),
};

const updateSchema = {
  ...createSchema,
  sushiId: Joi.any().strip(),
  institutionId: Joi.any().strip(),
};

class Task extends typedModel(type, schema, createSchema, updateSchema) {
  static async findByInstitutionId(institutionId) {
    return this.findAll({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  static async findBySushiId(sushiId) {
    return this.findAll({
      filters: [
        { term: { [`${type}.sushiId`]: sushiId } },
      ],
    });
  }

  static deleteByInstitutionId(institutionId) {
    this.deleteByQuery({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  static deleteBySushiId(sushiId) {
    this.deleteByQuery({
      filters: [
        { term: { [`${type}.sushiId`]: sushiId } },
      ],
    });
  }

  getSushi() {
    if (!this.data.sushiId) { return null; }
    return getModel('sushi').findById(this.data.sushiId);
  }

  getInstitution() {
    if (!this.data.institutionId) { return null; }
    return getModel('institution').findById(this.data.institutionId);
  }

  setStatus(status) {
    this.data.status = status;
  }

  setResult(result) {
    this.data.result = result;
  }

  done() {
    this.data.status = 'finished';
    this.updateRunningTime();
  }

  updateRunningTime() {
    if (this.data && this.data.createdAt) {
      this.data.runningTime = Date.now() - this.data.createdAt.getTime();
    }
  }

  fail(errors) {
    this.data.status = 'error';

    if (Array.isArray(errors)) {
      errors.forEach((message) => this.log('error', message));
    }

    this.updateRunningTime();
  }

  log(logType, message) {
    if (!Array.isArray(this.data.logs)) {
      this.data.logs = [];
    }

    this.data.logs.push({
      date: new Date(),
      type: logType,
      message: typeof message === 'string' ? message : JSON.stringify(message),
    });
  }
}

registerModel(Task);
module.exports = Task;
