export const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const convertDate = (date) => {
  let match;
  if ((match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).([0-9]{3})Z$/i.exec(date)) !== null) {
    return `${match[1]}`;
  }
  return date;
};

export const defaultTask = {
  _id: '',
  dashboardId: null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: '',
    createdAt: '',
    print: false,
  },
};
