import { format, formatDistance } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';

/**
 * @typedef {import('date-fns').FormatDateOptions} FormatDateOptions
 * @typedef {import('date-fns').FormatDistanceOptions} FormatDistanceOptions
 * @typedef {Date | number | string} DateType
 */

const availableLocales = { fr, en: enGB };

/**
 * Get the formatted date according to the string of tokens passed in.
 *
 * @see https://date-fns.org/docs/format
 *
 * @param {DateType} date The date to format
 * @param {'fr' | 'en'} locale The locale to use
 * @param {string} [format] The combination of tokens to format the date. (Default: PPPp)
 * @param {FormatDateOptions} [options] Options to pass to date-fns
 *
 * @returns {string | undefined} Reactive formatted date
 */
export function dateFormat(date, locale, formatStr = 'PPPp', options = {}) {
  try {
    return format(
      date,
      formatStr,
      { locale: availableLocales[locale], ...options },
    );
  } catch (err) {
    return undefined;
  }
}

/**
 * Get the distance between now and a date.
 *
 * @see https://date-fns.org/docs/formatDistance
 *
 * @param {DateType} date The date to compare with
 * @param {'fr' | 'en'} locale The locale to use
 * @param {FormatDistanceOptions} options Options to pass to date-fns
 *
 * @returns {string | undefined} The formatted distance
 */
export function timeAgo(date, locale, options = {}) {
  try {
    return formatDistance(
      0,
      date,
      { locale: availableLocales[locale], ...options },
    );
  } catch (err) {
    return undefined;
  }
}
