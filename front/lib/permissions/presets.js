import { featureScopes } from './utils';

const guestPreset = {
  features: new Map([
    ['institution', 'read'],
  ]),
  repositories: 'read',
  repositoryAliases: 'read',
  spaces: 'read',
};

const techContactPreset = {
  features: new Map(featureScopes.map((scope) => [scope, 'write'])),
  repositories: 'write',
  repositoryAliases: 'read',
  spaces: 'write',
};

const docContactPreset = {
  features: new Map(featureScopes.map((scope) => [scope, 'write'])),
  repositories: 'read',
  repositoryAliases: 'read',
  spaces: 'write',
};

export default new Map([
  ['guest', guestPreset],
  ['contact:tech', techContactPreset],
  ['contact:doc', docContactPreset],
]);
