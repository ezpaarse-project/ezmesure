const kibana = require('../../services/kibana');
const elastic = require('../../services/elastic');

const { DEFAULT_SPACE } = kibana;

exports.list = async (ctx) => {
  const { data: spaces } = await kibana.getSpaces();

  if (!Array.isArray(spaces)) {
    ctx.throw(500, ctx.$t('errors.spaces.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = spaces;
};

exports.getSpace = async (ctx) => {
  const { spaceId } = ctx.request.params;

  const { data: space, status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
  }

  ctx.type = 'json';
  ctx.body = space;
};

exports.listIndexPatterns = async (ctx) => {
  const { spaceId } = ctx.request.params;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
  }

  const { data } = await kibana.findObjects({
    spaceId: spaceId === DEFAULT_SPACE ? null : spaceId,
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
  const { body = {} } = ctx.request;
  const { id: spaceId } = body;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 200) {
    ctx.throw(409, ctx.$t('errors.space.alreadyExists', spaceId));
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

exports.updateSpace = async (ctx) => {
  const { spaceId } = ctx.request.params;
  const { body = {} } = ctx.request;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
    return;
  }

  const { data: newSpace } = await kibana.updateSpace(body);

  ctx.status = 200;
  ctx.body = newSpace;
};

exports.createIndexPattern = async (ctx) => {
  const { spaceId } = ctx.request.params;
  const { body = {} } = ctx.request;

  const { status } = await kibana.getSpace(spaceId);

  if (status === 404) {
    ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
    return;
  }

  const { data } = await kibana.findObjects({
    spaceId: spaceId === DEFAULT_SPACE ? null : spaceId,
    type: 'index-pattern',
    perPage: 1000,
  });
  const patterns = data && data.saved_objects;

  if (Array.isArray(patterns)) {
    const patternExists = patterns.some((obj) => {
      const title = obj && obj.attributes && obj.attributes.title;
      return title === body.title;
    });

    if (patternExists) {
      ctx.throw(409, ctx.$t('errors.indexPattern.alreadyExists', body.title, spaceId));
    }
  }

  const { body: hasMatchingIndices } = await elastic.indices.exists({
    index: body.title,
    allowNoIndices: false,
  });

  if (!hasMatchingIndices) {
    ctx.throw(409, ctx.$t('errors.indexPattern.noIndexMatching', body.title));
  }

  const space = spaceId === DEFAULT_SPACE ? null : spaceId;
  const { data: createdIndexPattern } = await kibana.createIndexPattern(space, body);

  ctx.status = 201;
  ctx.body = createdIndexPattern;
};

exports.deleteSpace = async (ctx) => {
  const { spaceId } = ctx.request.params;

  try {
    await kibana.deleteSpace(spaceId);
  } catch (e) {
    const status = e && e.response && e.response.status;

    if (status === 404) {
      ctx.throw(404, ctx.$t('errors.space.notFound', spaceId));
    } else {
      ctx.throw(e);
    }
  }

  ctx.status = 204;
};
