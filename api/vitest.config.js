import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      NODE_OPTIONS: '--disable-warning=DEP0128',
    },
  },
});
