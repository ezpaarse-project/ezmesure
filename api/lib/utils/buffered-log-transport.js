const { Transport } = require('winston');

/**
 * A Winston transport that keeps the last N logs in memory
 */
module.exports = class BufferedLogTransport extends Transport {
  constructor(opts) {
    super(opts);

    this.name = 'buffered';
    this.maxLogs = opts.size || 500;

    // Using a ring buffer to limit overhead
    this.buffer = new Array(this.maxLogs);
    this.count = 0;
    this.writeIndex = 0;
  }

  getLogs() {
    return [
      ...this.buffer.slice(this.writeIndex, this.count),
      ...this.buffer.slice(0, this.writeIndex),
    ];
  }

  log(info, callback) {
    this.buffer[this.writeIndex] = info;
    this.writeIndex = (this.writeIndex + 1) % this.maxLogs;

    if (this.count < this.maxLogs) { this.count += 1; }

    setImmediate(() => {
      this.emit('logged', info);
    });

    callback();
  }
};
