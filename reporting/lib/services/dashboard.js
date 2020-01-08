const rison = require('rison-node');
const elastic = require('./elastic');

const getDashboard = async (dashboardId, namespace) => {
  const { body: data } = await elastic.search({
    index: '.kibana',
    timeout: '30s',
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                type: 'dashboard',
              },
            },
            {
              match: {
                _id: `${namespace ? `${namespace}:` : ''}dashboard:${dashboardId}`,
              },
            },
          ],
        },
      },
    },
  });

  if (data && data.hits && data.hits.hits) {
    return data.hits.hits[0];
  }

  return null;
};

module.exports = {
  getDashboard,

  data: async (dashboardId, space, frequency) => {
    const dashboard = await getDashboard(dashboardId, space);

    if (!dashboard) {
      return null;
    }

    const { _source: source } = dashboard;

    const sourceJSON = JSON.parse(source.dashboard.kibanaSavedObjectMeta.searchSourceJSON);
    const panelsJSON = JSON.parse(source.dashboard.panelsJSON);
    const referencesData = source.references;

    const filters = sourceJSON.filter;
    const index = referencesData.find((ref) => ref.name === filters[0].meta.indexRefName);

    if (index) {
      // FIXME: filters can be empty
      filters[0].meta.index = index.id;
      delete filters[0].meta.indexRefName;
    }

    const panels = panelsJSON.map((panel) => {
      const reference = referencesData.find((ref) => ref.name === panel.panelRefName);

      return {
        ...panel,
        type: reference ? reference.type : panel.type,
        id: reference ? reference.id : panel.id,
        panelRefName: reference ? undefined : panel.panelRefName,
      };
    });

    const gData = rison.encode({
      time: {
        from: `now-${frequency}`,
        to: 'now',
      },
    });

    const aData = rison.encode({
      description: source.dashboard.description,
      filters,
      fullScreenMode: false,
      options: JSON.parse(source.dashboard.optionsJSON),
      panels,
      query: sourceJSON.query,
      timeRestore: true,
      title: source.dashboard.title,
      viewMode: 'view',
    });

    return {
      dashboardUrl: `${space ? `s/${space}/` : ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(gData)}&_a=${encodeURIComponent(aData)}`,
      dashboard: {
        title: source.dashboard.title,
        description: source.dashboard.description,
      },
    };
  },
};
