const rison = require('rison-node');
const elastic = require('./elastic');
const Frequency = require('./frequency');

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

  buildDashboardUrl(dashboardId, space, frequencyString) {
    if (!dashboardId || !frequencyString) {
      return null;
    }

    const frequency = new Frequency(frequencyString);

    if (!frequency.isValid()) {
      throw new Error('invalid frequency');
    }

    const now = new Date();
    const gData = rison.encode({
      time: {
        from: frequency.startOfPreviousPeriod(now),
        to: frequency.startOfCurrentPeriod(now),
      },
    });

    return `${space ? `s/${space}/` : ''}app/kibana#/dashboard/${dashboardId}?_g=${encodeURIComponent(gData)}`;
  },
};
