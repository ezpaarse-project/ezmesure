const { Joi } = require('koa-joi-router');

/**
 * Strip fields from a given schema
 * @param {Object} schema
 * @returns Object
 */
function stripFieldsFrom(schema = {}) {
  return Object.fromEntries(
    Object.keys(schema).map((field) => ([field, Joi.any().strip()])),
  );
}

/**
 * Fields that can be changed by regular users
 */
const regularFields = {
  parentInstitutionId: Joi.string().allow(null),

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
};

/**
 * Fields that can be changed by admins
 */
const requiredFields = {
  name: regularFields.name.required(),
};

/**
 * Fields that cannot be changed by regular users
 */
const restrictedFields = {
  validated: Joi.boolean(),
  hidePartner: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = Object.fromEntries(
  [
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
  ].map(
    (field) => [field, Joi.any().strip()],
  ),
);

/**
 * Schema to be applied when an administrator creates an institution
 */
const adminCreateSchema = {
  ...regularFields,
  ...requiredFields,
  ...restrictedFields,
  ...immutableFields,

  validated: restrictedFields.validated.default(false),
  hidePartner: restrictedFields.hidePartner.default(false),

  auto: regularFields.auto.keys({
    ezmesure: Joi.boolean().default(false),
    ezpaarse: Joi.boolean().default(false),
    report: Joi.boolean().default(false),
    sushi: Joi.boolean().default(false),
  }).default(),
};

/**
 * Schema to be applied when an administrator updates an institution
 */
const adminUpdateSchema = {
  ...regularFields,
  ...restrictedFields,
  ...immutableFields,
};

/**
 * Schema to be applied when a regular user updates an institution
 */
const updateSchema = {
  ...regularFields,
  ...stripFieldsFrom(restrictedFields),
  ...immutableFields,
};

/**
 * Schema to be applied when a regular user creates an institution
 */
const createSchema = {
  ...updateSchema,
  ...requiredFields,
};

module.exports = {
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  createSchema: Joi.object(createSchema).required(),
};
