/* eslint-disable import/no-extraneous-dependencies */
import { fr, en } from 'vuetify/lib/locale';

export default function vuetifyLocales() {
  const { nuxt } = this;

  nuxt.hook('i18n:extend-messages', (msgs) => {
    msgs.push({
      en: { $vuetify: en },
      fr: { $vuetify: fr },
    });
  });
}
