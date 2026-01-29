// @ts-check

const { FEATURES } = require('../../entities/memberships.dto');

/**
 * @typedef {'none'|'read'|'write'} PermissionLevel
 *
 * @typedef {Object.<string,PermissionLevel>} Preset
 * @property {PermissionLevel} [institution]
 * @property {PermissionLevel} [memberships]
 * @property {PermissionLevel} [sushi]
 * @property {PermissionLevel} [reporting]
 * @property {PermissionLevel} [spaces]
 * @property {PermissionLevel} [repositories]
 */

/**
 * Merge multiple permission presets into one, keeping only the highest level for each feature
 *
 * @param {Preset[]} presets - Array of permission presets.
 * @param {Object} [opts]
 * @param {boolean} [opts.keepNone] - If false, features with 'none' level will be removed
 *
 * @returns {Preset} Merged permission preset.
 */
module.exports.mergePresets = (presets, opts) => {
  /** @type {Preset} */
  const mergedPreset = {};

  presets.forEach((preset) => {
    Object.entries(preset ?? {}).forEach(([feature, level]) => {
      if (level === 'write') {
        mergedPreset[feature] = 'write';
      }
      if (level === 'read' && mergedPreset[feature] !== 'write') {
        mergedPreset[feature] = 'read';
      }
      if (level === 'none' && opts?.keepNone !== false && !mergedPreset[feature]) {
        mergedPreset[feature] = 'none';
      }
    });
  });

  return mergedPreset;
};

/**
 * Given a permission preset, return an array of all the permissions
 *
 * For example, if the preset is { institution: 'write', memberships: 'read' },
 * the returned array would be ['institution:read', 'institution:write', 'memberships:read'].
 *
 * @param {Preset} preset - The permission preset to get the permissions from.
 * @returns {string[]} An array of permissions that are included in the preset.
 */
module.exports.getPermissionsFromPreset = (preset) => Array.from(new Set(
  Object.keys(FEATURES).flatMap((feature) => {
    if (preset?.[feature] === 'write') { return [`${feature}:read`, `${feature}:write`]; }
    if (preset?.[feature] === 'read') { return [`${feature}:read`]; }
    return [];
  }),
));
