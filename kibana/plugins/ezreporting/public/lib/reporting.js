export const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const defaultTask = (dashboardId) => ({
  _id: '',
  dashboardId: dashboardId || null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: [],
    createdAt: '',
    print: false,
  },
});

export const ms2Str = (time) => {
  let ms = time;
  let s = Math.floor(ms / 1000);
  ms %= 1000;
  let m = Math.floor(s / 60);
  s %= 60;
  const h = Math.floor(m / 60);
  m %= 60;

  if (h) { return `${h}h ${m}m`; }
  if (m) { return `${m}m ${s}s`; }
  if (s) { return `${s}s`; }

  return `${ms}ms`;
};

export let httpClient;

export function setHttpClient(client) {
  httpClient = client;
}
