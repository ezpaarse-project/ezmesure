export const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const defaultTask = {
  _id: '',
  dashboardId: null,
  reporting: {
    frequency: '1w',
    emails: '',
    createdAt: '',
    print: false,
  },
};
