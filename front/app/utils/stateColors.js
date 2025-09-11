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
  ['missing', { color: 'orange', icon: 'mdi-file-hidden' }],
  ['finished', { color: 'green', icon: 'mdi-check' }],
  ['running', { color: 'blue', icon: 'mdi-play' }],
  ['delayed', { color: 'blue', icon: 'mdi-update' }],
  ['failed', { color: 'red', icon: 'mdi-exclamation' }],
  ['interrupted', { color: 'red', icon: 'mdi-progress-close' }],
  ['cancelled', { color: 'red', icon: 'mdi-cancel' }],
  ['waiting', { color: 'grey', icon: 'mdi-clock-outline' }],
]);

export const counterVersionsColors = new Map([
  ['5', 'rgb(205, 233, 250)'],
  ['5.1', 'rgb(203, 252, 220)'],
]);

export const httpStatusColors = {
  get: (code) => {
    if (code < 200) {
      return { color: 'blue', icon: 'mdi-information' };
    }
    if (code < 400) {
      return { color: 'green', icon: 'mdi-check' };
    }
    if (code < 600) {
      return { color: 'red', icon: 'mdi-close' };
    }
    return undefined;
  },
};

export const genericColorPalette = [
  ['#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231'],
  ['#911EB4', '#42D4F4', '#F032E6', '#BFEF45', '#FABED4'],
  ['#469990', '#DCBEFF', '#9A6324', '#FFFAC8', '#800000'],
  ['#AAFFC3', '#808000', '#FFD8B1', '#000075', '#A9A9A9'],
];
