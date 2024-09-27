import fs from 'node:fs/promises';
import { join } from 'node:path';

import YAML from 'yaml';
import { defineNuxtModule, useLogger } from 'nuxt/kit';

// eslint-disable-next-line import/no-unresolved
import * as vuetifyLocales from 'vuetify/locale';

const SUPPORTED_EVENTS = new Set(['add', 'unlink', 'change']);

/**
 * Parse a YAML locale file, merge it with Vuetify locales, and writes it in a JSON file
 *
 * @param {string} src The src dir
 * @param {string} dist The dist dir
 * @param {string} code The language code
 */
async function buildLocale(src, dist, code) {
  const lang = await fs.readFile(
    join(src, `${code}.yaml`),
    'utf-8',
  );

  const messages = {
    ...YAML.parse(lang),
    $vuetify: vuetifyLocales[code],
  };

  await fs.writeFile(
    join(dist, `${code}.json`),
    JSON.stringify(messages),
    'utf-8',
  );
}

/**
 * Nuxt plugin to build locales based on YAML files
 */
export default defineNuxtModule({
  meta: {
    name: 'locale-builder',
  },
  defaults: {
    src: 'locales',
  },
  async setup(options, nuxt) {
    const logger = useLogger('locale-builder');
    logger.info('Building locales...');

    const { locales, langDir } = nuxt.options.i18n;
    const { src } = options;
    const watcherRegex = new RegExp(`^${src}[/\\\\](.+).yaml$`, 'i');

    // Building all locales at startup
    await Promise.all(
      locales.map(async ({ code }) => {
        try {
          await buildLocale(src, langDir, code);
          logger.info(`"${code}.json" built`);
        } catch (error) {
          logger.error(`Failed to build "${code}.json": ${error}`);
        }
      }),
    );
    logger.success('All locales built');

    // Setup the watcher for dev mode
    nuxt.hook('builder:watch', async (event, path) => {
      if (!SUPPORTED_EVENTS.has(event)) {
        return;
      }
      const match = watcherRegex.exec(path);
      if (!match?.[1]) {
        return;
      }

      try {
        await buildLocale(src, langDir, match[1]);
        logger.success(`"${match[1]}.json" built`);
      } catch (error) {
        logger.error(`Failed to build "${match[1]}.json": ${error}`);
      }
    });
  },
});
