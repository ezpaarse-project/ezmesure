const timesSpan = [
  { text: 'Weekly', value: '1w' },
  // { text: 'Twice a week', value: '2w' },
  { text: 'Monthly', value: '1m' },
  // { text: 'Bimonthly', value: '2m' },
  { text: 'Quarterly', value: '3m' },
  { text: 'Semi-annual', value: '6m' },
  { text: 'Annual', value: '1y' },
];

export const timesSpanData = timesSpan;

export const convertTimeSpan = (timesSpanValue) => {
  return timesSpan.find(({ value }) => value === timesSpanValue).text;
};

export const defaultDashboard = {
  id: null,
  dashboard: {
    value: null,
    text: null,
  },
  reporting: {
    timeSpan: null,
    emails: null,
  },
};