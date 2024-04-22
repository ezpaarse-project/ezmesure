// @ts-check

module.exports = class LocalizedError extends Error {
  /**
   * @param {string} i18nKey
   * @param {any[]} [i18nArgs]
   */
  constructor(i18nKey, i18nArgs = []) {
    super(i18nKey);
    this.detail = i18nArgs;
  }
};
