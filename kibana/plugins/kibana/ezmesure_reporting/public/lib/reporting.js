/* eslint-disable @kbn/eslint/require-license-header */
const frequencies = [
  { text: 'Weekly', value: '1w' },
  // { text: 'Twice a week', value: '2w' },
  { text: 'Monthly', value: '1m' },
  // { text: 'Bimonthly', value: '2m' },
  { text: 'Quarterly', value: '3m' },
  { text: 'Semi-annual', value: '6m' },
  { text: 'Annual', value: '1y' },
];

export const frequenciesData = frequencies;

export const convertFrequency = frequency => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const defaultDashboard = {
  _id: '',
  dashboard: {
    value: '',
    text: '',
  },
  reporting: {
    frequency: '1w',
    emails: '',
    createdAt: '',
  },
};
