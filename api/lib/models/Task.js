const { Joi } = require('koa-joi-router');
const { typedModel, registerModel, getModel } = require('./TypedModel');

const type = 'task';

const schema = {
  id: Joi.string().trim().required(),
  sushiId: Joi.string().trim().required(),
  institutionId: Joi.string().trim().required(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  type: Joi.string().trim(),
  status: Joi.string(),
  runningTime: Joi.number(),

  logs: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    type: Joi.string().trim(),
    message: Joi.string().trim(),
  })),

  steps: Joi.array().items(Joi.object({
    label: Joi.string().trim(),
    status: Joi.string().trim(),
    startTime: Joi.date(),
    took: Joi.number(),
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

  static async findByStatus(status) {
    return this.findAll({
      filters: [
        { terms: { [`${type}.status`]: status } },
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

  static async findOnePerSushiId(sushiIds) {
    return this.findAll({
      filters: [
        { terms: { [`${type}.sushiId`]: sushiIds } },
      ],
      collapse: {
        field: `${type}.sushiId`,
      },
    });
  }

  static deleteByInstitutionId(institutionId) {
    return this.deleteByQuery({
      filters: [
        { term: { [`${type}.institutionId`]: institutionId } },
      ],
    });
  }

  static deleteBySushiId(sushiId) {
    return this.deleteByQuery({
      filters: [
        { term: { [`${type}.sushiId`]: sushiId } },
      ],
    });
  }

  static interruptRunningTasks() {
    return this.updateByQuery({
      filters: [
        { term: { [`${type}.status`]: 'running' } },
      ],
      script: `
        ctx._source.${type}.status = 'interrupted';

        if (ctx._source.${type}.steps instanceof List) {
          for(step in ctx._source.${type}.steps) {
            if (step.status == 'running') {
              step.status = 'interrupted';
            }
          }
        }
      `,
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

  getStep(label) {
    if (!Array.isArray(this.data.steps)) { return null; }
    return this.data.steps.find((s) => s.label === label);
  }

  newStep(label) {
    if (!Array.isArray(this.data.steps)) {
      this.data.steps = [];
    }

    this.data.steps.push({
      label,
      startTime: new Date(),
      status: 'running',
      took: 0,
    });
  }

  endStep(label, opts = {}) {
    const step = this.getStep(label);
    if (!step) { return; }

    const { success = true } = opts;
    step.took = Date.now() - step.startTime;
    step.status = success ? 'finished' : 'failed';
  }

  endRunningSteps(opts = {}) {
    if (!Array.isArray(this.data.steps)) { return; }

    this.data.steps
      .filter((step) => step.status === 'running')
      .forEach((step) => {
        this.endStep(step.label, opts);
      });
  }

  hasCompletedStep(label) {
    const step = this.getStep(label);
    return !!(step && step.status === 'finished');
  }

  done() {
    this.data.status = 'finished';
    this.updateRunningTime();
    this.emit('finish');
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
    this.endRunningSteps({ success: false });
    this.emit('finish');
  }

  on(eventName, callback) {
    if (typeof eventName !== 'string' || typeof callback !== 'function') { return; }
    if (!this.listeners) { this.listeners = new Map(); }
    this.listeners.set(eventName, callback);
  }

  emit(eventName, ...args) {
    if (typeof eventName !== 'string' || !this.listeners) { return; }
    const listener = this.listeners.get(eventName);
    if (typeof listener === 'function') {
      listener(...args);
    }
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
