const { v4: uuid } = require('uuid');

const ActionsService = require('../../entities/actions.service');
const ApiKeysService = require('../../entities/api-key.service');

const { schema, includableFields } = require('../../entities/api-key.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');

/**
 * @typedef {import('koa').Context} KoaContext
 */

// Query params for sub routes

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['name'],
});
exports.standardQueryParams = standardQueryParams;

// Routes

/**
 * Get all API keys of institution
 *
 * @param {KoaContext} ctx
 */
exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.omit = { value: true }; // avoid exposing api-key's hash

  const service = new ApiKeysService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await service.count({ where: prismaQuery.where }));
  ctx.body = await service.findMany(prismaQuery);
};

/**
 * Get specific API key of institution
 *
 * @param {KoaContext} ctx
 */
exports.getOne = async (ctx) => {
  const { apiKeyId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: apiKeyId });
  prismaQuery.omit = { value: true }; // avoid exposing api-key's hash

  const service = new ApiKeysService();
  const apiKey = await service.findUnique(prismaQuery);

  if (!apiKey) {
    ctx.throw(404, ctx.$t('errors.apiKey.notFound', apiKeyId));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = apiKey;
};

/**
 * Create API key for an institution
 *
 * @param {KoaContext} ctx
 */
exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  // Value that must be present in the header for auth
  const value = uuid();

  // Prevent API keys to have permissions on other API keys
  const permissions = body.permissions.filter((perm) => perm.split(':')[0] !== 'api-keys');

  const result = await ApiKeysService.$transaction(async (service) => {
    // Creating API Key in database
    const newApiKey = await service.create({
      data: {
        ...body,
        // Give permissions if linked to institution
        permissions: body.institutionId ? permissions : [],
        // Hashing value to avoid malicious access in case of database dump
        value: ApiKeysService.getHashValue(value),

        // Create repository permissions, or not if not linked to institution
        repositoryPermissions: body.institutionId ? {
          create: body.repositoryPermissions.map((perm) => ({
            ...perm,
            pattern: undefined,
            // Connect to repository of institution
            repository: {
              connect: {
                pattern: perm.pattern,
                institutions: { some: { id: body.institutionId } },
              },
            },
          })),
        } : [],

        // Create alias permissions, or not if not linked to institution
        repositoryAliasPermissions: body.institutionId ? {
          create: body.repositoryAliasPermissions.map((perm) => ({
            ...perm,
            aliasPattern: undefined,
            // Connect to alias of institution
            alias: {
              connect: {
                pattern: perm.aliasPattern,
                institutions: { some: { id: body.institutionId } },
              },
            },
          })),
        } : [],

        // Link api key to institution
        institution: body.institutionId ? {
          connect: { id: body.institutionId },
        } : undefined,

        // Keep author or link to user
        user: {
          connect: { username: body.institutionId ? ctx.state.user.username : body.username },
        },
      },
      include: {
        repositoryPermissions: true,
        repositoryAliasPermissions: true,
      },
    });

    // Creating action to trace what happened
    const actions = new ActionsService(service);
    await actions.create({
      data: {
        type: 'api-keys/create',

        data: {
          state: { ...newApiKey, value: undefined }, // avoid exposing api-key's hash in actions
        },

        institution: body.institutionId ? {
          connect: { id: body.institutionId },
        } : undefined,
        author: {
          connect: { username: ctx.state.user.username },
        },
      },
    });

    return newApiKey;
  });

  // Return API Key with newly created value
  ctx.type = 'json';
  ctx.status = 201;
  ctx.body = {
    ...result,
    value,
  };
};

/**
 * Update API key for an institution
 *
 * @param {KoaContext} ctx
 */
exports.updateOne = async (ctx) => {
  const { apiKeyId } = ctx.params;
  const { body } = ctx.request;

  const result = await ApiKeysService.$transaction(async (service) => {
    // Looking if key exists for institution
    const apiKey = await service.findUnique({
      where: { id: apiKeyId },
    });
    if (!apiKey) {
      ctx.throw(404, ctx.$t('errors.apiKey.notFound', apiKeyId));
      return;
    }

    // Update date if modified
    let activeUpdatedAt;
    if (body.active !== apiKey.active) {
      activeUpdatedAt = new Date();
    }

    // Update API key with new attributes
    const newApiKey = await service.update({
      where: { id: apiKeyId },
      data: {
        ...body,
        activeUpdatedAt,
      },
    });

    // Creating action to track what happened
    const actions = new ActionsService(service);
    await actions.create({
      data: {
        type: 'api-keys/update',

        data: {
          state: { ...newApiKey, value: undefined }, // avoid exposing api-key's hash in actions
          oldState: { ...apiKey, value: undefined },
        },

        institution: apiKey.institutionId ? {
          connect: { id: apiKey.institutionId },
        } : undefined,
        author: {
          connect: { username: ctx.state.user.username },
        },
      },
    });

    return newApiKey;
  });

  // Returning new API key (without the value)
  ctx.type = 'json';
  ctx.status = 201;
  ctx.body = { ...result, value: undefined }; // avoid exposing api-key's hash
};

/**
 * Delete API key for an institution
 *
 * @param {KoaContext} ctx
 */
exports.deleteOne = async (ctx) => {
  const { institutionId, apiKeyId } = ctx.params;

  await ApiKeysService.$transaction(async (service) => {
    // Looking if key exists for institution
    const apiKey = await service.findUnique({
      where: { id: apiKeyId, institutionId },
    });
    if (!apiKey) {
      return;
    }

    // Deleting key
    await service.delete({ where: { id: apiKeyId } });

    // Creating action to track what happened
    const actions = new ActionsService(service);
    await actions.create({
      data: {
        type: 'api-keys/delete',

        data: {
          oldState: { ...apiKey, value: undefined }, // avoid exposing api-key's hash
        },

        institution: apiKey.institutionId ? {
          connect: { id: apiKey.institutionId },
        } : undefined,

        author: {
          connect: { username: ctx.state.user.username },
        },
      },
    });
  });

  ctx.type = 'json';
  ctx.status = 204;
};
