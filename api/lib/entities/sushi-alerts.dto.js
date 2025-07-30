const { Joi } = require('koa-joi-router');

const { enums } = require('../services/prisma');

const {
  withModifiers,
  ignoreFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  createdAt: Joi.date(),

  type: Joi.string().allow(...Object.values(enums.SushiAlertType)),
  severity: Joi.string().required(),
  context: Joi.object(),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'deletedAt',
  'type',
  'severity',
  'context',
];

/**
 * Schema to be applied when a regular user creates SUSHI credentials
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

module.exports = {
  schema,
  createSchema: Joi.object(createSchema).required(),
};
