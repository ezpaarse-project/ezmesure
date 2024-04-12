module.exports = class HarvestError extends Error {
  constructor(message, options) {
    super(message);
    this.type = options?.type;
    this.cause = options?.cause;
  }
};
