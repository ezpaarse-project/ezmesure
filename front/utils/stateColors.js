export const repoColors = new Map([
  ['ezpaarse', 'teal'],
  ['counter5', 'red'],
]);

export const serviceColors = new Map([
  ['ezpaarse', 'teal'],
  ['ezcounter', 'red'],
  ['ezreeport', 'blue'],
]);

export const roleColors = new Map([
  ['contact:tech', { color: 'blue', icon: 'mdi-wrench' }],
  ['contact:doc', { color: 'green', icon: 'mdi-book-open-variant' }],
  ['guest', { icon: 'mdi-badge-account' }],
]);

export const sushiStatus = new Map([
  ['success', { color: 'green', icon: 'mdi-check' }],
  ['untested', { color: 'grey', icon: 'mdi-lan-pending' }],
  ['unauthorized', { color: 'orange', icon: 'mdi-key-alert-outline' }],
  ['failed', { color: 'red', icon: 'mdi-close' }],
]);

export const harvestStatus = new Map([
  ['finished', { color: 'green', icon: 'mdi-check' }],
  ['running', { color: 'blue', icon: 'mdi-play' }],
  ['delayed', { color: 'blue', icon: 'mdi-update' }],
  ['failed', { color: 'red', icon: 'mdi-exclamation' }],
  ['interrupted', { color: 'red', icon: 'mdi-progress-close' }],
  ['cancelled', { color: 'red', icon: 'mdi-cancel' }],
  ['waiting', { color: 'grey', icon: 'mdi-clock-outline' }],
]);
