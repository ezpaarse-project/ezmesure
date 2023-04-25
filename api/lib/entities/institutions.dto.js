const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type import('joi').SchemaLike
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  name: Joi.string().trim().min(1),
  type: Joi.string().allow(''),
  acronym: Joi.string().allow(''),
  websiteUrl: Joi.string().allow(''),
  city: Joi.string().allow(''),
  uai: Joi.string().allow(''),

  social: Joi.object().pattern(Joi.string(), Joi.string().allow('')),
  auto: Joi.object().pattern(Joi.string(), Joi.boolean()),

  sushiReadySince: Joi.date().allow(null),
  logo: Joi.any().strip(),
  logoId: Joi.string().allow(null),

  validated: Joi.boolean(),
  hidePartner: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),

  parentInstitutionId: Joi.string().allow(null),
  parentInstitution: Joi.object(),

  memberships: Joi.array().items(Joi.object()),
  spaces: Joi.array().items(Joi.object()),
  historyEntries: Joi.array().items(Joi.object()),
  sushiCredentials: Joi.array().items(Joi.object()),
  childInstitutions: Joi.array().items(Joi.object()),
  repositories: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed by regular users
 */
const restrictedFields = [
  'validated',
  'hidePartner',
  'tags',
];

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'logoId',
  'parentInstitution',
  'memberships',
  'spaces',
  'historyEntries',
  'sushiCredentials',
  'childInstitutions',
  'repositories',
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
  {
    auto: (s) => s.keys({
      ezmesure: Joi.boolean().default(false),
      ezpaarse: Joi.boolean().default(false),
      report: Joi.boolean().default(false),
      sushi: Joi.boolean().default(false),
    }),
  },
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
  ignoreFields(restrictedFields),
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when a regular user creates an institution
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(restrictedFields),
  ignoreFields(immutableFields),
  requireFields(['name']),
);

module.exports = {
  schema,
  restrictedFields,
  immutableFields,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  createSchema: Joi.object(createSchema).required(),
};
