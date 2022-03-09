const SushiEndpoint = require('../../models/SushiEndpoint');

exports.getAll = async (ctx) => {
  const filters = [];
  const {
    requireCustomerId,
    requireRequestorId,
    requireApiKey,
    isSushiCompliant,
    tags,
  } = ctx.query;

  if (typeof requireCustomerId === 'boolean') {
    filters.push(SushiEndpoint.filterBy('requireCustomerId', requireCustomerId));
  }
  if (typeof requireRequestorId === 'boolean') {
    filters.push(SushiEndpoint.filterBy('requireRequestorId', requireRequestorId));
  }
  if (typeof requireApiKey === 'boolean') {
    filters.push(SushiEndpoint.filterBy('requireApiKey', requireApiKey));
  }
  if (typeof isSushiCompliant === 'boolean') {
    filters.push(SushiEndpoint.filterBy('isSushiCompliant', isSushiCompliant));
  }
  if (tags) {
    filters.push(SushiEndpoint.filterBy('tags', Array.isArray(tags) ? tags : tags.split(',').map((s) => s.trim())));
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await SushiEndpoint.findAll({ filters });
};

exports.getOne = async (ctx) => {
  const { endpoint } = ctx.state;

  ctx.status = 200;
  ctx.body = endpoint;
};

exports.addEndpoint = async (ctx) => {
  ctx.action = 'endpoint/create';
  const { body } = ctx.request;

  ctx.metadata = {
    vendor: body.vendor,
  };

  const endpoint = new SushiEndpoint(body, {
    schema: ctx.state?.userIsAdmin ? 'adminCreate' : 'create',
  });
  await endpoint.save();

  ctx.metadata.endpointId = endpoint.getId();
  ctx.status = 201;
  ctx.body = endpoint;
};

exports.updateEndpoint = async (ctx) => {
  ctx.action = 'endpoint/update';
  const { endpoint } = ctx.state;
  const { body } = ctx.request;

  endpoint.update(body, {
    schema: ctx.state?.userIsAdmin ? 'adminUpdate' : 'update',
  });

  ctx.metadata = {
    endpointId: endpoint.getId(),
    vendor: endpoint.get('vendor'),
  };

  try {
    await endpoint.save();
  } catch (e) {
    throw new Error(e);
  }

  ctx.status = 200;
  ctx.body = endpoint;
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'endpoint/delete';
  const { endpointId } = ctx.params;
  const { endpoint } = ctx.state;

  ctx.metadata = {
    endpointId: endpoint.id,
    endpointVendor: endpoint.get('vendor'),
  };

  await SushiEndpoint.deleteOne(endpointId);

  ctx.status = 204;
};

exports.importEndpoints = async (ctx) => {
  ctx.action = 'endpoint/import';
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

  const importItem = async (endpointData = {}) => {
    if (endpointData.id) {
      const endpoint = await SushiEndpoint.findById(endpointData.id);

      if (endpoint && !overwrite) {
        addResponseItem(endpointData, 'conflict', ctx.$t('errors.endpoint.import.alreadyExists', endpoint.getId()));
        return;
      }
    }

    const endpoint = new SushiEndpoint(endpointData);

    endpoint.setId(endpointData.id);

    await endpoint.save();

    addResponseItem(endpoint, 'created');
  };

  for (let i = 0; i < body.length; i += 1) {
    const endpointData = body[i] || {};

    try {
      await importItem(endpointData); // eslint-disable-line no-await-in-loop
    } catch (e) {
      addResponseItem(endpointData, 'error', e.message);
    }
  }

  ctx.type = 'json';
  ctx.body = response;
};
