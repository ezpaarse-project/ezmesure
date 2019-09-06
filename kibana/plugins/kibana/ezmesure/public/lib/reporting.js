const timesSpan = [
  { text: 'Hebdomadaire', value: '1w' },
  // { text: 'Bihebdomadaire', value: '2w' },
  { text: 'Mensuelle', value: '1m' },
  // { text: 'Bimestrielle', value: '2m' },
  { text: 'Trimestrielle', value: '3m' },
  { text: 'Semestrielle', value: '6m' },
  { text: 'Annuelle', value: '1y' },
];

export const timeSpanData = timesSpan;

export const convertTimeSpan = (timesSpanValue) => {
  return timesSpan.find(timeSpan => timeSpan.value === timesSpanValue).text;
};

export const defaultDashboard = {
  _id: null,
  dashboard: {
    id: null,
    name: null,
  },
  reporting: {
    timeSpan: null,
    reporting: null,
  },
};

export const dashboards = [
  {
    value: 'aaaaa',
    text: 'Dashboard aa',
  },
  {
    value: 'bbbbb',
    text: 'Dashboard bb',
  },
];

export const dataReporting = [
  {
    _id: 1,
    dashboard: {
      id: 'aaaaa',
      name: 'Dashboard aa',
    },
    reporting: {
      timeSpan: '1w',
      emails: 'a@a.a,b@b.b',
    },
  },
  {
    _id: 2,
    dashboard: {
      id: 'bbbbb',
      name: 'Dashboard bb',
    },
    reporting: {
      timeSpan: '1m',
      emails: 'a@a.a',
    },
  },
];