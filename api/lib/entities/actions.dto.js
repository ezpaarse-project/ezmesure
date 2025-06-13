const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  date: Joi.date(),

  id: Joi.string().trim().min(1),
  type: Joi.string().trim().min(1),
  institutionId: Joi.string().trim().min(1),
  authorId: Joi.string().trim().min(1),
  data: Joi.object(),

  author: Joi.object(),
  institution: Joi.object(),
};

// Actions are created by the API, so they should be immutable

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'author',
  'author.memberships',
  'author.memberships.repositoryPermissions',
  'author.memberships.repositoryAliasPermissions',
  'author.memberships.spacePermissions',
  'author.elasticRoles',
  'institution',
];

/**
 * Schema to be applied when an administrator imports multiple actions
 */
const adminImportSchema = withModifiers(
  schema,
  ignoreFields(['institutionId', 'authorId']),
);

module.exports = {
  schema,
  includableFields,
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
