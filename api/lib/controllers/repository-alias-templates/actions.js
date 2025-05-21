const RepoAliasTemplatesService = require('../../entities/repository-alias-templates.service');
const RepositoriesService = require('../../entities/repositories.service');

const repoAliasTemplateDto = require('../../entities/repository-alias-templates.dto');

const {
  adminUpdateSingleFieldSchema,
  adminImportSchema,
} = repoAliasTemplateDto;

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateCreateInput} RepositoryAliasTemplateCreateInput
 * @typedef {import('@prisma/client').Prisma.RepositoryAliasTemplateFindManyArgs} RepositoryAliasTemplateFindManyArgs
*/
/* eslint-enable max-len */

const { prepareStandardQueryParams } = require('../../services/std-query');

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

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

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
   * @param {RepositoryAliasTemplateService} repoAliasTemplatesService
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
      where: { pattern: item.pattern },
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
