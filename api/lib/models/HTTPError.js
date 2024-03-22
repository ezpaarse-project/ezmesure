// @ts-check

const LocalizedError = require('./LocalizedError');

module.exports = class HTTPError extends LocalizedError {
  /**
   * @param {number} status
   * @param {string} i18nKey
   * @param {any[]} [i18nArgs]
   */
  constructor(status, i18nKey, i18nArgs = []) {
    super(i18nKey, i18nArgs);
    this.status = status;
  }
};
