import { createResolver, useLogger, defineNuxtModule } from 'nuxt/kit';
// eslint-disable-next-line import/no-unresolved
import * as vuetifyLocales from 'vuetify/locale';

import fs from 'fs/promises';

export default defineNuxtModule({
  meta: {
    name: 'vuetify-i18n',
  },
  defaults: {
    outDir: 'node_modules/.cache/ezmesure-build/vuetify-i18n',
  },
  async setup(options, nuxt) {
    const logger = useLogger('vuetify-i18n');
    const { resolve } = createResolver(import.meta.url);

    const { outDir } = options;
    const langDir = resolve('..', outDir);

    // Caching Vuetify locales
    await fs.mkdir(outDir, { recursive: true });
    await Promise.all(
      nuxt.options.i18n.locales.map(async (locale) => {
        try {
          const code = typeof locale === 'string' ? locale : locale.code;
          await fs.writeFile(resolve(langDir, `${code}.json`), JSON.stringify({ $vuetify: vuetifyLocales[code] }));
          logger.info(`Cached "${code}" locale`);
        } catch (error) {
          logger.error(`Couldn't cache "${locale}" locale: ${error}`);
        }
      }),
    );

    // Loading Vuetify locales into i18n
    nuxt.hook('i18n:registerModule', (register) => {
      register({
        langDir,
        locales: nuxt.options.i18n.locales.map((locale) => {
          const code = typeof locale === 'string' ? locale : locale.code;
          return {
            code,
            file: `${code}.json`,
          };
        }),
      });
    });
  },
});
