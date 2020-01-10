const rison = require('rison-node');
const elastic = require('./elastic');

const getDashboard = async (dashboardId, namespace) => {
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

  buildDashboardUrl(dashboardId, space, frequency) {
    if (!dashboardId || !frequency) {
      return null;
    }

    const gData = rison.encode({
      time: {
        from: `now-${frequency}`,
        to: 'now',
      },
    });

    return `${space ? `s/${space}/` : ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(gData)}`;
  },
};
