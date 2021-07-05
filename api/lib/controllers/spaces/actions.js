const kibana = require('../../services/kibana');

exports.list = async (ctx) => {
  const { data: spaces } = await kibana.getSpaces();

  if (!Array.isArray(spaces)) {
    ctx.throw(500, ctx.$t('errors.spaces.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = spaces;
};

exports.listIndexPatterns = async (ctx) => {
  const { spaceId } = ctx.request.params;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
  }

  const { data } = await kibana.findObjects({
    spaceId,
    type: 'index-pattern',
    perPage: 1000,
  });
  let patterns = data && data.saved_objects;

  if (!Array.isArray(patterns)) {
    patterns = [];
  }

  ctx.status = 200;
  ctx.body = patterns;
};

exports.createSpace = async (ctx) => {
  const { spaceId } = ctx.request.params;
  const { body = {} } = ctx.request;

  const { data: space, status } = await kibana.getSpace(spaceId);

  if (status === 200) {
    ctx.status = 200;
    ctx.body = space;
    return;
  }

  const { data: newSpace } = await kibana.createSpace({
    ...body,
    id: spaceId,
    name: body.name || spaceId,
  });

  ctx.status = 201;
  ctx.body = newSpace;
};

