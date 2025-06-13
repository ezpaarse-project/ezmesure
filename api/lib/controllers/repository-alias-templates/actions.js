// @ts-check

const RepoAliasTemplatesService = require('../../entities/repository-alias-templates.service');
const RepositoryAliasesService = require('../../entities/repository-aliases.service');
const RepositoriesService = require('../../entities/repositories.service');
const InstitutionsService = require('../../entities/institutions.service');

const repoAliasTemplateDto = require('../../entities/repository-alias-templates.dto');

const { getPrismaManyQuery } = require('../institutions/actions').standardQueryParams;

const { interpolateString, interpolateObject } = require('../../services/utils');

const {
  adminUpdateSingleFieldSchema,
  adminImportSchema,
} = repoAliasTemplateDto;

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.InstitutionGetPayload<{ include: { customProps: true } }>} InstitutionWithProps
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasGetPayload<{ include: { institutions: true } }>} RepoAliasWithInstitutions
 * @typedef {import('@prisma/client').RepositoryAliasTemplate} RepositoryAliasTemplate
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasUncheckedCreateInput} RepositoryAliasUncheckedCreateInput
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateCreateInput} RepositoryAliasTemplateCreateInput
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateFindManyArgs} RepositoryAliasTemplateFindManyArgs
 * @typedef {import('@prisma/client').Prisma.InstitutionWhereInput} InstitutionWhereInput
 * @typedef {import('@prisma/client').Prisma.InstitutionPropertyWhereInput} InstitutionPropertyWhereInput
 * @typedef {import('koa').Context['query']} KoaQuery
 *
 * @typedef {object} ImportResponse
 * @property {number} errors
 * @property {number} conflicts
 * @property {number} created
 * @property {ImportResponseItem[]} items
 *
 * @typedef {object} ImportResponseItem
 * @property {string} status
 * @property {string} message
 * @property {RepositoryAliasTemplate[]} data
 *
 * @typedef {object} ApplyResponse
 * @property {number} total - The total number of aliases affected by the operation
 * @property {number} created - The number of created aliases
 * @property {number} updated - The number of updated aliases
 * @property {number} deleted - The number of old aliases that were deleted
 * @property {number} errors - The number of aliases that failed to be updated
 * @property {ApplyResponseItem[]} items - The list of affected aliases
 *
 * @typedef {'created' | 'updated' | 'deleted' | 'error'} ApplyResponseItemStatus
 *
 * @typedef {object} ApplyResponseItem
 * @property {ApplyResponseItemStatus | null} status - The status of the operation
 * @property {string | null} message - An error message, if any
 * @property {Partial<RepoAliasWithInstitutions>} data - The affected alias
 */
/* eslint-enable max-len */

const { prepareStandardQueryParams } = require('../../services/std-query');
const { appLogger } = require('../../services/logger');

const standardQueryParams = prepareStandardQueryParams({
  ...repoAliasTemplateDto,
  queryFields: ['id', 'pattern', 'target'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const { repository, type } = ctx.query;

  /** @type {RepositoryAliasTemplateFindManyArgs} */
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (repository || type) {
    prismaQuery.where = prismaQuery.where ?? {};
    prismaQuery.where.repository = {
      pattern: repository,
      type,
    };
  }

  const repositoryAliasTemplatesService = new RepoAliasTemplatesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await repositoryAliasTemplatesService.count({ where: prismaQuery.where }));
  ctx.body = await repositoryAliasTemplatesService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id }, {});

  const repositoryAliasTemplatesService = new RepoAliasTemplatesService();
  const repoAliasTemplate = await repositoryAliasTemplatesService.findUnique(prismaQuery);

  if (!repoAliasTemplate) {
    ctx.throw(404, ctx.$t('errors.repoAliasTemplate.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = repoAliasTemplate;
};

exports.applyOne = async (ctx) => {
  const { id } = ctx.params;
  const { dryRun } = ctx.query;

  const repositoryAliasTemplatesService = new RepoAliasTemplatesService();
  const aliasTemplate = await repositoryAliasTemplatesService.findUnique({ where: { id } });

  if (!aliasTemplate) {
    ctx.throw(404, ctx.$t('errors.repoAliasTemplate.notFound'));
    return;
  }

  const repositoriesService = new RepositoriesService();
  const repo = await repositoriesService.findUnique({ where: { pattern: aliasTemplate.target } });

  if (!repo) {
    ctx.throw(404, ctx.$t('errors.repository.notFound', aliasTemplate.target));
    return;
  }

  const {
    conditions = [],
    filters: templateFilters = [],
    pattern: templatePattern,
  } = aliasTemplate;

  const institutionService = new InstitutionsService();
  const institutions = await institutionService.findManyByConditions(
    conditions,
    getPrismaManyQuery,
  );

  /** @type {Map<string, Partial<RepoAliasWithInstitutions>>} */
  const aliases = new Map();

  institutions.forEach((institution) => {
    const interpolateContext = {
      ...institution,
      customProps: Object.fromEntries(institution.customProps.map((p) => [p.fieldId, p.value])),
    };
    const aliasPattern = interpolateString(templatePattern, interpolateContext);
    const aliasFilters = interpolateObject(templateFilters, interpolateContext);

    let alias = aliases.get(aliasPattern);

    if (alias) {
      alias.institutions?.push(institution);
    } else {
      /** @type {Partial<RepoAliasWithInstitutions>} */
      alias = {
        templateId: aliasTemplate.id,
        pattern: aliasPattern,
        target: aliasTemplate.target,
        filters: aliasFilters,
        institutions: [institution],
      };

      aliases.set(aliasPattern, alias);
    }
  });

  /** @type {ApplyResponse} */
  const response = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
    items: [],
  };

  /**
   * Add an alias to the response and increment the counters
   * @param {Partial<RepoAliasWithInstitutions>} data
   * @param {ApplyResponseItemStatus} status
   * @param {string | null} message
   */
  const addResponseItem = (data, status, message) => {
    response.total += 1;

    if (status === 'created') { response.created += 1; }
    if (status === 'updated') { response.updated += 1; }
    if (status === 'deleted') { response.deleted += 1; }
    if (status === 'error') { response.errors += 1; }

    response.items.push({ status, message, data });
  };

  await RepositoryAliasesService.$transaction(async (repositoryAliasesService) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const alias of aliases.values()) {
      const isValidPattern = /^[a-z0-9_-]+$/i.test(alias.pattern ?? '');

      if (!isValidPattern) {
        addResponseItem(alias, 'error', ctx.$t('errors.repositoryAlias.invalidPattern'));
        continue; // eslint-disable-line no-continue
      }

      /** @type {RepositoryAliasUncheckedCreateInput} */
      const data = {
        templateId: alias.templateId,
        pattern: alias.pattern ?? '',
        target: alias.target ?? '',
        filters: alias.filters ?? '',
      };

      try {
        // eslint-disable-next-line no-await-in-loop
        const existingAlias = await repositoryAliasesService.findUnique({
          where: { pattern: alias.pattern },
        });

        if (existingAlias) {
          if (!dryRun) {
            // eslint-disable-next-line no-await-in-loop
            await repositoryAliasesService.update({
              where: { pattern: alias.pattern },
              data: {
                ...data,
                institutions: {
                  set: alias.institutions?.map((i) => ({ id: i.id })),
                },
              },
            });
          }

          addResponseItem(alias, 'updated', null);
        } else {
          if (!dryRun) {
            // eslint-disable-next-line no-await-in-loop
            await repositoryAliasesService.create({
              data: {
                ...data,
                institutions: {
                  connect: alias.institutions?.map((i) => ({ id: i.id })),
                },
              },
            });
          }

          addResponseItem(alias, 'created', null);
        }
      } catch (e) {
        appLogger.error(`[alias-template] Failed to upsert alias [${alias.pattern}]:\n${e}`);
        addResponseItem(alias, 'error', e.message);
        continue; // eslint-disable-line no-continue
      }
    }

    const oldAliases = await repositoryAliasesService.findMany({
      where: {
        templateId: aliasTemplate.id,
        pattern: { notIn: Array.from(aliases.keys()) },
      },
      include: { institutions: true },
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const oldAlias of oldAliases) {
      try {
        if (!dryRun) {
          // eslint-disable-next-line no-await-in-loop
          await repositoryAliasesService.delete({ where: { pattern: oldAlias.pattern } });
        }

        addResponseItem(oldAlias, 'deleted', null);
      } catch (e) {
        appLogger.error(`[alias-template] Failed to delete old alias [${oldAlias.pattern}]:\n${e}`);
        addResponseItem(oldAlias, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = response;
};

exports.upsertOne = async (ctx) => {
  const { id } = ctx.params;
  const { body } = ctx.request;

  const { upserted, existing } = await RepoAliasTemplatesService.$transaction(async (service) => {
    if (body?.target) {
      const repositoriesService = new RepositoriesService(service);
      const repo = await repositoriesService.findUnique({ where: { pattern: body.target } });

      if (!repo) {
        ctx.throw(404, ctx.$t('errors.repository.notFound'));
      }
    }

    return {
      existing: await service.findUnique({
        where: { id },
      }),
      upserted: await service.upsert({
        where: { id },
        create: { id, ...body },
        update: { id, ...body },
      }),
    };
  });

  ctx.status = existing ? 200 : 201;
  ctx.body = upserted;
};

exports.updateOneProperty = async (ctx) => {
  const { id, field } = ctx.params;
  const { value } = ctx.request.body;

  const { value: data, error } = adminUpdateSingleFieldSchema.validate({ [field]: value });

  if (error) {
    ctx.throw(400, error.message);
  }

  const upserted = await RepoAliasTemplatesService.$transaction(async (service) => {
    if (field === 'target') {
      const repositoriesService = new RepositoriesService(service);
      const repo = await repositoriesService.findUnique({ where: { pattern: value } });

      if (!repo) {
        ctx.throw(404, ctx.$t('errors.repository.notFound'));
      }
    }

    return service.update({ where: { id }, data });
  });

  ctx.status = 200;
  ctx.body = upserted;
};

exports.deleteOne = async (ctx) => {
  const { id } = ctx.params;

  const repositoryAliasTemplatesService = new RepoAliasTemplatesService();

  await repositoryAliasTemplatesService.delete({
    where: { id },
  });

  ctx.status = 204;
};

exports.importMany = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  /** @type {ImportResponse} */
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
   * @param {RepoAliasTemplatesService} repoAliasTemplatesService
   * @param {*} itemData
   */
  const importItem = async (repoAliasTemplatesService, itemData = {}) => {
    const { value: item, error } = adminImportSchema.validate(itemData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const template = await repoAliasTemplatesService.findUnique({ where: { id: item.id } });

      if (template && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.repoAliasTemplate.alreadyExists', template.id));
        return;
      }
    }

    /** @type {RepositoryAliasTemplateCreateInput} */
    const data = {
      ...item,
      aliases: {
        connect: item.aliases?.map(
          (alias) => ({
            pattern: alias.pattern,
          }),
        ),
      },
    };

    const template = await repoAliasTemplatesService.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    addResponseItem(template, 'created');
  };

  await RepoAliasTemplatesService.$transaction(async (repoAliasTemplatesService) => {
    for (let i = 0; i < body.length; i += 1) {
      const templateData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(repoAliasTemplatesService, templateData);
      } catch (e) {
        addResponseItem(templateData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};
