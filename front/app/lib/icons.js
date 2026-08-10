import * as mdi from '@mdi/js';

// Aliasing to avoid importing icons
export const allAliases = Object.keys(mdi)
  .filter((name) => name.startsWith('mdi'))
  .map((name) => {
    const aliasName = name
      .replace(/[A-Z]/g, '-$&')
      .toLowerCase();

    return [
      aliasName,
      name,
    ];
  });

export const allIcons = allAliases.map(([name]) => name);
