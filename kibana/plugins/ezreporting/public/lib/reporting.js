export const convertFrequency = (frequencies, frequency) => {
  const freq = frequencies.find(({ value }) => value === frequency);
  return freq ? freq.text : 'Error';
};

export const convertDate = (date, hours) => {
  let match;
  if ((match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]{2}:[0-9]{2}:[0-9]{2}).([0-9]{3})Z$/i.exec(date)) !== null) {
    if (hours) return `${match[1]} ${match[2]}`;
    return `${match[1]}`;
  }
  return date;
};

export const defaultTask = (dashboardId) => ({
  _id: '',
  dashboardId: dashboardId || null,
  exists: true,
  reporting: {
    frequency: '1w',
    emails: '',
    createdAt: '',
    print: false,
  },
});

export const ms2Str = (time) => {
  if (time < 1000) {
    return `${time}ms`
  }
  
  if (time > 1000) {
    const executionTime = [];
  
    const s = Number.parseInt(time / 1000, 10)
    const sec = Number.parseInt(s % 60, 10);
    executionTime.push(`${sec}s`);

    executionTime.push(`${time % 1000}ms`);
    
    if (s > 60) {
      const min = Number.parseInt((time / (60 * 1000)), 10);
      executionTime.unshift(`${min}m`);
    }
      
    return executionTime.join(' ');
  }
};
