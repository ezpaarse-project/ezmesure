const rison = require('rison-node');
const elastic = require('./elastic')

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
    let _gData, _aData, dashboard;

    dashboard = await getDashboard(dashboardId, space);

    if (!dashboard) {
      return null;
    }

    const source = dashboard._source;

    const sourceJSON = JSON.parse(source.dashboard.kibanaSavedObjectMeta.searchSourceJSON);
    const panelsJSON = JSON.parse(source.dashboard.panelsJSON);
    const referencesData = source.references;

    const filters = sourceJSON.filter;

    const index = referencesData.find(ref => ref.name === filters[0].meta.indexRefName);
    if (index) {
      filters[0].meta.index = index.id;
      delete filters[0].meta.indexRefName;
    }

    panelsJSON.forEach((panel) => {
      const reference = referencesData.find(ref => ref.name === panel.panelRefName);
      if (reference) {
        panel.type = reference.type;
        panel.id = reference.id;

        delete panel.panelRefName;
      }
    });

    if (source.dashboard.timeRestore) {
      _gData = rison.encode({
        refreshInterval: source.dashboard.refreshInterval,
        time: {
          from: `now-${frequency}`,
          to: 'now',
        },
      });
    }

    _aData = rison.encode({
      description: source.dashboard.description,
      filters,
      fullScreenMode: false,
      options: JSON.parse(source.dashboard.optionsJSON),
      panels: panelsJSON,
      query: sourceJSON.query,
      timeRestore: source.dashboard.timeRestore,
      title: source.dashboard.title,
      viewMode: 'view',
    });

    return {
      dashboardUrl: `${space ? `s/${space}`: ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(_gData)}&_a=${encodeURIComponent(_aData)}`,
      dashboard: {
        title: source.dashboard.title,
        description: source.dashboard.description,
      },
    };
  },
}