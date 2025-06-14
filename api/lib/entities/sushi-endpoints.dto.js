const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  sushiUrl: Joi.string().uri(),
  vendor: Joi.string().min(1),
  description: Joi.string().allow('').empty(null),
  counterVersions: Joi.array().items(Joi.string().regex(/^[0-9]+(\.[0-9]+(\.[0-9]+(\.[0-9]+)?)?)?$/)).min(1),
  registryId: Joi.string().allow('').empty(null),
  technicalProvider: Joi.string().allow('').empty(null),

  active: Joi.boolean(),
  activeUpdatedAt: Joi.date(),

  requireCustomerId: Joi.boolean(),
  requireRequestorId: Joi.boolean(),
  requireApiKey: Joi.boolean(),
  ignoreReportValidation: Joi.boolean(),

  defaultCustomerId: Joi.string().allow('').empty(null),
  defaultRequestorId: Joi.string().allow('').empty(null),
  defaultApiKey: Joi.string().allow('').empty(null),
  paramSeparator: Joi.string().allow('').empty(null),
  harvestDateFormat: Joi.string().allow('').empty(null),
  testedReport: Joi.string().allow('').empty(null).lowercase(),
  tags: Joi.array().items(Joi.string()),

  ignoredReports: Joi.array().items(Joi.string().lowercase()),
  additionalReports: Joi.array().items(Joi.string().lowercase()),

  credentials: Joi.array().items(Joi.object()),

  disabledUntil: Joi.date().allow(null),
  supportedReports: Joi.array().items(Joi.string().trim()),
  supportedReportsUpdatedAt: Joi.date().allow(null),
  supportedData: Joi.object().pattern(
    Joi.string(), // reportId
    Joi.object({
      supported: Joi.object({
        value: Joi.boolean(),
        raw: Joi.boolean().optional(),
        manual: Joi.boolean().optional(),
      }),
      firstMonthAvailable: Joi.object({
        value: Joi.string().regex(/^\d{4}-\d{2}$/),
        raw: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
        manual: Joi.boolean().optional(),
      }).optional(),
      lastMonthAvailable: Joi.object({
        value: Joi.string().regex(/^\d{4}-\d{2}$/),
        raw: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
        manual: Joi.boolean().optional(),
      }).optional(),
    }),
  ),
  supportedDataUpdatedAt: Joi.date().allow(null),

  params: Joi.array().items(Joi.object({
    name: Joi.string().trim(),
    value: Joi.string().trim(),
    scope: Joi.string().trim().lowercase(),
  })),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'credentials',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'credentials',
  'credentials.institution',
  'credentials.institution.memberships',
  'credentials.institution.spaces',
  'credentials.institution.repositories',
];

/**
 * Schema to be applied when an administrator creates a SUSHI endpoint
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['sushiUrl', 'vendor']),
  withDefaults({
    requireCustomerId: false,
    requireRequestorId: false,
    requireApiKey: false,
    ignoreReportValidation: false,
    testedReport: null,
  }),
);

/**
 * Schema to be applied when an administrator updates a SUSHI endpoint
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator import multiple SUSHI endpoints
 */
const adminImportSchema = withModifiers(
  adminCreateSchema,
  { id: () => schema.id },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
