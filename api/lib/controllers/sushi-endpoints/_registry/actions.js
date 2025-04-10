const counterRegistry = require('../../../services/counter-registry');
const sushi = require('../../../services/sushi');

exports.getAll = async (ctx) => {
  const platforms = await counterRegistry.getAllPlatforms();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = platforms.map((p) => ({
    id: p.id,
    name: p.abbrev ? `${p.abbrev} (${p.name})` : `${p.name}`,
    website: p.website,
    counterVersions: Array.from(new Set(p.sushi_services.map((s) => s.counter_release))),
  }));
};

exports.getOne = async (ctx) => {
  const { id } = ctx.params;

  const platform = await counterRegistry.getPlatform(id);
  if (!platform) {
    ctx.throw(404, ctx.$t('errors.sushi-endpoint.notFound'));
  }

  let domainFound = '';
  const urlPerVersion = new Map();

  const endpoint = {
    vendor: platform.name,
    registryId: platform.id,
    description: [],
    counterVersions: new Set(),
    technicalProvider: new Set(),
    tags: new Set(),
    requireRequestorId: true,
    requireCustomerId: true,
    requireApiKey: true,
  };

  const dataHosts = new Set();

  // eslint-disable-next-line no-restricted-syntax
  for (const service of platform.sushi_services) {
    const { domain, baseUrl: url } = sushi.getSushiURL(
      { sushiUrl: service.url },
      service.counter_release,
    );

    if (domainFound && domainFound !== domain) {
      // eslint-disable-next-line no-continue
      continue;
    }

    domainFound = domain;
    urlPerVersion.set(service.counter_release, url);

    endpoint.counterVersions.add(service.counter_release);
    dataHosts.add(service.data_host);
    const description = [];

    endpoint.requireRequestorId = service.requestor_id_required && endpoint.requireRequestorId;
    endpoint.requireCustomerId = service.customer_id_required && endpoint.requireCustomerId;
    endpoint.requireApiKey = service.api_key_required && endpoint.requireApiKey;

    if (service.credentials_auto_expire) {
      let autoExpireText = ctx.$t('sushi-endpoint.credentialsAutoExpire');
      if (service.credentials_auto_expire) { autoExpireText += `: ${service.credentials_auto_expire}`; }
      endpoint.tags.add('Expire');
      description.push(autoExpireText);
    }
    if (service.platform_specific_info) {
      description.push(service.platform_specific_info);
    }

    if (description.length > 0) {
      endpoint.description.push(`COUNTER ${service.counter_release}:`, ...description);
    }
  }

  await Promise.all(
    Array.from(dataHosts).map(async (hostUrl) => {
      const hostId = /usage-data-host\/(.+)\/?$/.exec(hostUrl)?.[1];
      if (!hostId) { return; }

      const dataHost = await counterRegistry.getDataHost(hostId);
      endpoint.technicalProvider.add(dataHost.name);
    }),
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    ...endpoint,
    // Using COUNTER5 by default, cause of Scholarly iQ (and others) putting a /r5 in the URL
    // if COUNTER5 is not available, take the first one
    sushiUrl: urlPerVersion.get('5') || Array.from(urlPerVersion.values())[0],
    // Format description
    description: endpoint.description.join('\n'),
    // Transform sets to arrays
    counterVersions: Array.from(endpoint.counterVersions),
    // Format technicalProvider
    technicalProvider: Array.from(endpoint.technicalProvider).join(', '),
    // Transform sets to arrays
    tags: Array.from(endpoint.tags),
  };
};
