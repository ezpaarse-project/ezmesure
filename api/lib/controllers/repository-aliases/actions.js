const { Prisma } = require('../../.prisma/client.mts');

const elastic = require('../../services/elastic');
const RepositoryAliasesService = require('../../entities/repository-aliases.service');
const RepositoriesService = require('../../entities/repositories.service');

const {
  schema,
  includableFields,
  adminImportSchema,
} = require('../../entities/repository-aliases.dto');

const {
  PrismaErrors,
  Prisma: { PrismaClientKnownRequestError },
} = require('../../services/prisma');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasCreateInput} RepositoryAliasCreateInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasWhereInput} RepositoryAliasWhereInput
*/
/* eslint-enable max-len */

const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['pattern', 'target'],
});
exports.standardQueryParams = standardQueryParams;

exports.getMany = async (ctx) => {
  const { institutionId, repository, type } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (institutionId) {
    prismaQuery.where.institutions = {
      some: { id: institutionId },
    };
  }
  if (repository || type) {
    prismaQuery.where.repository = {
      pattern: repository,
      type,
    };
  }

  const repositoryAliasesService = new RepositoryAliasesService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await repositoryAliasesService.count({ where: prismaQuery.where }));
  ctx.body = await repositoryAliasesService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { pattern } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { pattern });

  const repositoryAliasesService = new RepositoryAliasesService();
  const repositoryAlias = await repositoryAliasesService.findUnique(prismaQuery);

  if (!repositoryAlias) {
    ctx.throw(404, ctx.$t('errors.repositoryAlias.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = repositoryAlias;
};

exports.createOne = async (ctx) => {
  const { body } = ctx.request;

  let repository;

  const configUpsert = {
    create: {
      ...body,
      institutionId: undefined,
    },
    update: {
      institutionId: undefined,
    },
  };

  if (body?.institutionId) {
    configUpsert.create.institutions = { connect: { id: body?.institutionId } };
    configUpsert.update.institutions = { connect: { id: body?.institutionId } };
  }

  try {
    repository = await RepositoryAliasesService.$transaction(
      async (repositoryAliasesService) => {
        const repositoriesService = new RepositoriesService(repositoryAliasesService);
        const repo = await repositoriesService.findUnique({ where: { pattern: body.target } });

        if (!repo) {
          ctx.throw(404, ctx.$t('errors.repository.notFound'));
        }

        return repositoryAliasesService.upsert({
          where: { pattern: body.pattern },
          ...configUpsert,
        });
      },
    );
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.repositoryAlias.alreadyExists', body?.pattern));
          break;
        case PrismaErrors.RecordNotFound:
          ctx.throw(404, ctx.$t('errors.institution.notFound'));
          break;
        default:
      }
    }
    throw e;
  }

  ctx.status = 201;
  ctx.body = repository;
};

exports.updateOne = async (ctx) => {
  const { body, params } = ctx.request;

  let updatedRepository;

  try {
    updatedRepository = await RepositoryAliasesService.$transaction(
      async (repositoryAliasesService) => {
        if (body?.target) {
          const repositoriesService = new RepositoriesService(repositoryAliasesService);
          const repo = await repositoriesService.findUnique({ where: { pattern: body.target } });

          if (!repo) {
            ctx.throw(404, ctx.$t('errors.repository.notFound'));
          }
        }

        return repositoryAliasesService.update({
          where: {
            pattern: params.pattern,
          },
          data: {
            filters: Prisma.DbNull,
            ...body,
          },
        });
      },
    );
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      switch (e?.code) {
        case PrismaErrors.UniqueContraintViolation:
          ctx.throw(409, ctx.$t('errors.repositoryAlias.alreadyExists', body?.pattern));
          break;
        default:
      }
    }

    throw e;
  }

  ctx.status = 200;
  ctx.body = updatedRepository;
};

exports.deleteOne = async (ctx) => {
  const { pattern } = ctx.params;

  const repositoryAliasesService = new RepositoryAliasesService();

  await repositoryAliasesService.delete({
    where: { pattern },
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
   * @param {RepositoryAliasesService} repositoryAliasesService
   * @param {*} repositoryData
   */
  const importItem = async (repositoryAliasesService, repositoryData = {}) => {
    const { value: item, error } = adminImportSchema.validate(repositoryData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.pattern) {
      const repo = await repositoryAliasesService.findUnique({ where: { pattern: item.pattern } });

      if (repo && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.repository.alreadyExists', repo.pattern));
        return;
      }
    }

    /** @type {RepositoryAliasCreateInput} */
    const data = {
      ...item,
      permissions: {
        connectOrCreate: item.permissions?.map(
          (permission) => ({
            where: {
              username_institutionId_aliasPattern: {
                username: permission.username,
                institutionId: permission.institutionId,
                aliasPattern: item.pattern,
              },
            },
            create: {
              ...permission,
              username: undefined,
              institutionId: undefined,
              aliasPattern: undefined,
              membership: {
                connect: {
                  username_institutionId: {
                    username: permission.username,
                    institutionId: permission.institutionId,
                  },
                },
              },
            },
          }),
        ),
      },
      institutions: {
        connect: item.institutions?.map(
          (institution) => ({
            id: institution.id,
          }),
        ),
      },
    };

    const repo = await repositoryAliasesService.upsert({
      where: { pattern: item.pattern },
      create: data,
      update: data,
    });

    addResponseItem(repo, 'created');
  };

  await RepositoryAliasesService.$transaction(async (repositoryAliasesService) => {
    for (let i = 0; i < body.length; i += 1) {
      const repoData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(repositoryAliasesService, repoData);
      } catch (e) {
        addResponseItem(repoData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.getOrphans = async (ctx) => {
  const repositoryAliasesService = new RepositoryAliasesService();

  const { body } = await elastic.indices.getAlias({ name: '*,-.*' });

  const allAliases = Object.entries(body).flatMap(([index, settings]) => (
    Object
      .entries(settings?.aliases ?? {})
      .map(([alias, { filter } = {}]) => ({ index, alias, filter }))
  ));

  const orphanAliases = [];
  const batchSize = 100;

  for (let i = 0; i < allAliases.length; i += batchSize) {
    const aliases = allAliases.slice(i, i + batchSize);

    // eslint-disable-next-line no-await-in-loop
    const repoAliases = await repositoryAliasesService.findMany({
      where: {
        pattern: {
          in: aliases.map((alias) => alias.alias),
        },
      },
      select: {
        pattern: true,
      },
    });

    const patterns = new Set(repoAliases.map((alias) => alias.pattern));
    orphanAliases.push(...aliases.filter((alias) => !patterns.has(alias.alias)));
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = orphanAliases;
};
