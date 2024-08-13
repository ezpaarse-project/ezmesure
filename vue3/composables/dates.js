import {
  computed,
  useI18n,
  toValue,
  dateFormat,
  timeAgo,
} from '#imports';

/**
 * Get the formatted date according to the string of tokens passed in in the current locale.
 *
 * @see https://date-fns.org/docs/format
 *
 * @param {import('vue').MaybeRefOrGetter<DateType>} date The (reactive) date to format
 * @param {import('vue').MaybeRefOrGetter<string>} [format] The (reactive) combination of tokens
 * to format the date. (Default: PPPp)
 * @param {FormatDateOptions} [options] Options to pass to date-fns
 *
 * @returns {ComputedRef<string | undefined>} Reactive formatted date
 */
export function useDateFormat(date, formatStr, options) {
  const { locale } = useI18n();

  const reactiveValue = computed(() => toValue(date));

  return computed(() => dateFormat(reactiveValue.value, locale.value, toValue(formatStr), options));
}

/**
 * Get the distance between now and a date in the current locale.
 *
 * @see https://date-fns.org/docs/formatDistance
 *
 * @param {import('vue').MaybeRefOrGetter<DateType>} date The (reactive) date to compare with
 * @param {FormatDistanceOptions} options Options to pass to date-fns
 *
 * @returns {ComputedRef<string | undefined>} The formatted distance
 */
export function useTimeAgo(date, options) {
  const { locale } = useI18n();

  const reactiveValue = computed(() => toValue(date));

  return computed(() => timeAgo(reactiveValue.value, locale.value, options));
}
