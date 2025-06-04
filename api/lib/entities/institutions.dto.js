const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  name: Joi.string().trim().min(1),
  namespace: Joi.string().trim().allow('').empty(null),
  type: Joi.string().allow('').empty(null),
  acronym: Joi.string().allow('').empty(null),
  websiteUrl: Joi.string().allow('').empty(null),
  city: Joi.string().allow('').empty(null),
  uai: Joi.string().allow('').empty(null),

  social: Joi.object().pattern(Joi.string(), Joi.string().allow('')),

  sushiReadySince: Joi.date().allow(null),
  logo: Joi.any().strip(),
  logoId: Joi.string().allow(null),

  validated: Joi.boolean(),
  hidePartner: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),

  parentInstitutionId: Joi.string().allow(null),
  parentInstitution: Joi.object(),

  customProps: Joi.array().items(Joi.object()),
  memberships: Joi.array().items(Joi.object()),
  spaces: Joi.array().items(Joi.object()),
  historyEntries: Joi.array().items(Joi.object()),
  sushiCredentials: Joi.array().items(Joi.object()),
  childInstitutions: Joi.array().items(Joi.object()),
  repositories: Joi.array().items(Joi.object()),
  repositoryAliases: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed by regular users
 */
const adminFields = [
  'validated',
  'hidePartner',
  'tags',
  'namespace',
  'customProps',
];

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'parentInstitution',
  'memberships',
  'spaces',
  'historyEntries',
  'sushiCredentials',
  'childInstitutions',
  'repositories',
  'customProps',
  'repositoryAliases',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'parentInstitution',
  'memberships',
  'spaces',
  'historyEntries',
  'sushiCredentials',
  'childInstitutions',
  'repositories',
  'customProps',
  'customProps.field',
  'repositoryAliases',
  'repositoryAliases.repository',
];

/**
 * Schema to be applied when an administrator creates an institution
 */
const adminCreateSchema = withModifiers(
  schema,
  requireFields(['name']),
  ignoreFields(immutableFields),
  withDefaults({
    validated: false,
    hidePartner: false,
  }),
);

/**
 * Schema to be applied when an administrator updates an institution
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when a regular user updates an institution
 */
const updateSchema = withModifiers(
  schema,
  ignoreFields(adminFields),
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when a regular user creates an institution
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(adminFields),
  ignoreFields(immutableFields),
  requireFields(['name']),
);

/**
 * Schema to be applied when an administrator imports an institution
 */
const adminImportSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    id: () => schema.id,
    spaces: () => schema.spaces,
    repositories: () => schema.repositories,
    sushiCredentials: () => schema.sushiCredentials,
    memberships: () => schema.memberships,
    customProps: () => schema.customProps,
    logo: () => Joi.string().base64(),
  },
);

module.exports = {
  schema,
  adminFields,
  immutableFields,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  createSchema: Joi.object(createSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
