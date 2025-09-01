const { v4: uuid } = require('uuid');

const ActionsService = require('../../entities/actions.service');
const ApiKeysService = require('../../entities/api-key.service');

const { schema, importSchema, includableFields } = require('../../entities/api-key.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');

/* eslint-disable max-len */
/**
 * @typedef {import('koa').Context} KoaContext
 *
 * @typedef {import('@prisma/client').Prisma.ApiKeyCreateInput} ApiKeyCreateInput
 * @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionCreateInput} ApiKeyRepositoryPermissionCreateInput
 * @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryAliasPermissionCreateInput} ApiKeyRepositoryAliasPermissionCreateInput
 * @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryPermissionCreateOrConnectWithoutApiKeyInput} ApiKeyRepositoryPermissionCreateOrConnectWithoutApiKeyInput
 * @typedef {import('@prisma/client').Prisma.ApiKeyRepositoryAliasPermissionCreateOrConnectWithoutApiKeyInput} ApiKeyRepositoryAliasPermissionCreateOrConnectWithoutApiKeyInput
 */
/* eslint-enable max-len */

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
  const { source } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  // avoid exposing api-key's hash by default
  // still need a way to export them so we can include the hash's value
  if (source !== '*') {
    prismaQuery.omit = { value: true };
  }

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
  const { source } = ctx.query;
  const { apiKeyId } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: apiKeyId });

  // avoid exposing api-key's hash by default
  // still need a way to export them so we can include the hash's value
  if (source !== '*') {
    prismaQuery.omit = { value: true };
  }

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
          create: body.repositoryPermissions.map(
            /** @returns {ApiKeyRepositoryPermissionCreateInput} */
            (perm) => ({
              ...perm,
              repositoryPattern: undefined,
              // Connect to repository of institution
              repository: {
                connect: {
                  pattern: perm.repositoryPattern,
                  institutions: { some: { id: body.institutionId } },
                },
              },
            }),
          ),
        } : [],

        // Create alias permissions, or not if not linked to institution
        repositoryAliasPermissions: body.institutionId ? {
          create: body.repositoryAliasPermissions.map(
            /** @returns {ApiKeyRepositoryAliasPermissionCreateInput} */
            (perm) => ({
              ...perm,
              aliasPattern: undefined,
              // Connect to alias of institution
              alias: {
                connect: {
                  pattern: perm.aliasPattern,
                  institutions: { some: { id: body.institutionId } },
                },
              },
            }),
          ),
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

/**
 * Import API keys
 *
 * @param {KoaContext} ctx
 */
exports.importMany = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {ApiKeysService} service
   * @param {*} itemData
   * @returns
   */
  const importItem = async (service, itemData = {}) => {
    const { value: item, error } = importSchema.validate(itemData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const institution = await service.findUnique({
        where: { id: item.id },
      });

      if (institution && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.apiKeys.import.alreadyExists', institution.id));
        return;
      }
    }
    // Prevent API keys to have permissions on other API keys
    const permissions = item.permissions.filter((perm) => perm.split(':')[0] !== 'api-keys');

    /** @type {ApiKeyCreateInput} */
    const data = {
      ...item,
      // Give permissions if linked to institution
      permissions,
      // value should be already included in item, and should be already hashed

      // Create repository permissions, or not if not linked to institution
      repositoryPermissions: (item.repositoryPermissions?.length ?? 0) > 0 ? {
        connectOrCreate: item.repositoryPermissions.map(
          /** @returns {ApiKeyRepositoryPermissionCreateOrConnectWithoutApiKeyInput} */
          (perm) => ({
            where: {
              apiKeyId_pattern: {
                apiKeyId: item.id,
                pattern: item.pattern,
              },
            },
            create: {
              ...perm,
              pattern: undefined,
              // Connect to repository of institution
              repository: {
                connect: {
                  pattern: perm.pattern,
                  institutions: { some: { id: item.institutionId } },
                },
              },
            },
          }),
        ),
      } : undefined,

      // Create alias permissions, or not if not linked to institution
      repositoryAliasPermissions: (item.repositoryAliasPermissions?.length ?? 0) > 0 ? {
        create: item.repositoryAliasPermissions.map(
          /** @returns {ApiKeyRepositoryAliasPermissionCreateOrConnectWithoutApiKeyInput} */
          (perm) => ({
            where: {
              apiKeyId_pattern: {
                apiKeyId: item.id,
                pattern: item.pattern,
              },
            },
            create: {
              ...perm,
              aliasPattern: undefined,
              // Connect to alias of institution
              alias: {
                connect: {
                  pattern: perm.aliasPattern,
                  institutions: { some: { id: item.institutionId } },
                },
              },
            },
          }),
        ),
      } : undefined,

      // Link api key to institution
      institution: item.institutionId ? {
        connect: { id: item.institutionId },
      } : undefined,

      // Keep author or link to user
      user: {
        connect: { username: item.username },
      },
    };

    const apiKey = await service.upsert({
      where: { id: item?.id },
      create: data,
      update: data,
    });

    addResponseItem(apiKey, 'created');
  };

  await ApiKeysService.$transaction(async (service) => {
    for (let i = 0; i < body.length; i += 1) {
      const keyData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(service, keyData);
      } catch (e) {
        addResponseItem(keyData, 'error', e.message);
      }
    }

    // Creating action to track what happened
    const actions = new ActionsService(service);
    await actions.create({
      data: {
        type: 'api-keys/import',

        data: {
          result: {
            errors: response.errors,
            conflicts: response.conflicts,
            created: response.created,
          },
        },

        author: {
          connect: { username: ctx.state.user.username },
        },
      },
    });
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = response;
};
