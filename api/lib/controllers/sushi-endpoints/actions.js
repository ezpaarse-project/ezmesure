const { adminImportSchema, includableFields } = require('../../entities/sushi-endpoints.dto');
const sushiEndpointService = require('../../entities/sushi-endpoints.service');
const { propsToPrismaInclude } = require('../utils');

exports.getAll = async (ctx) => {
  const {
    include: propsToInclude,
    requireCustomerId,
    requireRequestorId,
    requireApiKey,
    isSushiCompliant,
    tags,
    q: search,
  } = ctx.query;

  let include;

  if (ctx.state?.user?.isAdmin) {
    include = propsToPrismaInclude(propsToInclude, includableFields);
  }

  const where = {
    requireCustomerId,
    requireRequestorId,
    requireApiKey,
    isSushiCompliant,
  };

  if (tags) {
    where.tags = {
      hasSome: Array.isArray(tags) ? tags : tags.split(',').map((s) => s.trim()),
    };
  }

  if (search) {
    where.vendor = {
      contains: search,
      mode: 'insensitive',
    };
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await sushiEndpointService.findMany({ where, include });
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

  const endpoint = await sushiEndpointService.create({ data: body });

  ctx.metadata.endpointId = endpoint.id;
  ctx.status = 201;
  ctx.body = endpoint;
};

exports.updateEndpoint = async (ctx) => {
  ctx.action = 'endpoint/update';
  const { endpoint } = ctx.state;
  const { body } = ctx.request;

  ctx.metadata = {
    endpointId: endpoint.id,
    vendor: body.vendor || endpoint.vendor,
  };

  const updatedEndpoint = await sushiEndpointService.update({
    where: { id: endpoint.id },
    data: body,
  });

  ctx.status = 200;
  ctx.body = updatedEndpoint;
};

exports.deleteOne = async (ctx) => {
  ctx.action = 'endpoint/delete';
  const { endpointId } = ctx.params;
  const { endpoint } = ctx.state;

  ctx.metadata = {
    endpointId: endpoint.id,
    endpointVendor: endpoint.vendor,
  };

  await sushiEndpointService.delete({ where: { id: endpointId } });

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
    const { value: item, error } = adminImportSchema.validate(endpointData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const endpoint = await sushiEndpointService.findUnique({ where: { id: item.id } });

      if (endpoint && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.sushi-endpoint.import.alreadyExists', endpoint.id));
        return;
      }
    }

    const endpoint = await sushiEndpointService.upsert({
      where: { id: item?.id },
      create: item,
      update: item,
    });

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
