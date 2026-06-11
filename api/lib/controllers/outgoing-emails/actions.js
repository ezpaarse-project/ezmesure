const OutgoingEmailsService = require('../../entities/outgoing-emails.service');

const { schema, includableFields } = require('../../entities/outgoing-emails.dto');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['id', 'subject'],
});
exports.standardQueryParams = standardQueryParams;

exports.getAll = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  const emailsService = new OutgoingEmailsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await emailsService.count({ where: prismaQuery.where }));
  ctx.body = await emailsService.findMany(prismaQuery);
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id });

  const emailsService = new OutgoingEmailsService();
  const email = await emailsService.findUnique(prismaQuery);

  if (!email) {
    ctx.throw(404, ctx.$t('errors.email.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = email;
};

exports.deleteOne = async (ctx) => {
  const { id } = ctx.params;

  const emailsService = new OutgoingEmailsService();
  await emailsService.delete({ where: { id } });

  ctx.status = 204;
};
