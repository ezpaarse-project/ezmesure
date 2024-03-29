const rison = require('rison-node');
const elastic = require('./elastic');

const getDashboard = async (dashboardId, namespace) => {
  if (namespace === 'default') {
    namespace = null;
  }

  const { body: data } = await elastic.getSource({
    index: '.kibana',
    id: `${namespace ? `${namespace}:` : ''}dashboard:${dashboardId}`,
  });

  if (data && data.type === 'dashboard') {
    return data;
  }

  return null;
};

module.exports = {
  getDashboard,

  buildDashboardUrl(dashboardId, space, period) {
    if (!dashboardId || !period) {
      return null;
    }

    const { from, to } = period;
    const gData = rison.encode({
      time: { from, to },
    });

    const aData = rison.encode({
      timeRestore: true,
    });

    if (space === 'default') {
      space = null;
    }

    return `${space ? `s/${space}/` : ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(gData)}&_a=${encodeURIComponent(aData)}`;
  },
};
