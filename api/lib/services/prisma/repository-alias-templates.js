// @ts-check
const { client: prisma, Prisma } = require('./index');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.TransactionClient} TransactionClient
 * @typedef {import('../../.prisma/client.mjs').RepositoryAlias} RepositoryAlias
 * @typedef {import('../../.prisma/client.mjs').RepositoryAliasTemplate} RepositoryAliasTemplate
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateCountArgs} RepositoryAliasTemplateCountArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateUpdateArgs} RepositoryAliasTemplateUpdateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateUpsertArgs} RepositoryAliasTemplateUpsertArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateFindUniqueArgs} RepositoryAliasTemplateFindUniqueArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateFindManyArgs} RepositoryAliasTemplateFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateCreateArgs} RepositoryAliasTemplateCreateArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryAliasTemplateDeleteArgs} RepositoryAliasTemplateDeleteArgs
 *
 * @typedef {RepositoryAliasTemplate & { aliases: RepositoryAlias[] }} RepositoryAliasTemplateWithAliases
 * @typedef {{ result: RepositoryAliasTemplate, deletedItem: RepositoryAliasTemplateWithAliases }} RepositoryAliasTemplateRemoveResult
 */
/* eslint-enable max-len */

/**
 * @param {RepositoryAliasTemplateCreateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate>}
 */
function create(params, tx = prisma) {
  return tx.repositoryAliasTemplate.create(params);
}

/**
 * @param {RepositoryAliasTemplateFindManyArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate[]>}
 */
function findMany(params, tx = prisma) {
  return tx.repositoryAliasTemplate.findMany(params);
}

/**
 * @param {RepositoryAliasTemplateFindUniqueArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate | null>}
 */
function findUnique(params, tx = prisma) {
  return tx.repositoryAliasTemplate.findUnique(params);
}

/**
 * @param {string} id
 * @param {Object | null} includes
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate | null>}
 */
function findByID(id, includes = null, tx = prisma) {
  let include;
  if (includes) {
    include = {
      ...includes,
    };
  }
  return tx.repositoryAliasTemplate.findUnique({
    where: { id },
    include,
  });
}

/**
 * @param {RepositoryAliasTemplateUpdateArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate>}
 */
function update(params, tx = prisma) {
  return tx.repositoryAliasTemplate.update(params);
}

/**
 * @param {RepositoryAliasTemplateUpsertArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplate>}
 */
function upsert(params, tx = prisma) {
  return tx.repositoryAliasTemplate.upsert(params);
}

/**
 * @param {RepositoryAliasTemplateDeleteArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<RepositoryAliasTemplateRemoveResult | null>}
 */
async function remove(params, tx = prisma) {
  const aliasTemplate = await tx.repositoryAliasTemplate.findUnique({
    where: params.where,
    include: {
      aliases: true,
    },
  });

  if (!aliasTemplate) {
    return null;
  }

  return {
    result: await tx.repositoryAliasTemplate.delete(params),
    deletedItem: aliasTemplate,
  };
}

/**
 * @param {RepositoryAliasTemplateCountArgs} params
 * @param {TransactionClient} [tx]
 * @returns {Promise<number>}
 */
function count(params, tx = prisma) {
  return tx.repositoryAliasTemplate.count(params);
}

module.exports = {
  create,
  findMany,
  findUnique,
  findByID,
  update,
  upsert,
  remove,
  count,
};
