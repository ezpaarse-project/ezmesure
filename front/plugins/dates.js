import { fr, enGB as en } from 'date-fns/locale';
import {
  format,
  isValid,
  formatDistance,
} from 'date-fns';

const locales = { fr, en };

export default (ctx, inject) => {
  function getCurrentLocale() {
    const { locale } = ctx.app.i18n;
    return locales[locale];
  }

  const dateFunctions = {
    isValid,

    msToLocalDistance(ms, options = {}) {
      const locale = getCurrentLocale();
      return formatDistance(0, ms || 0, { locale, ...options });
    },

    format(date, formatStr, options = {}) {
      const locale = getCurrentLocale();
      return format(date, formatStr, { locale, ...options });
    },
  };

  inject('dateFunctions', dateFunctions);
};
