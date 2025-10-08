const hookEmitter = require('./hookEmitter');

// Import various hooks here
require('./ezreeport');
require('./elastic');
require('./kibana');
require('./harvest');
require('./users');

module.exports = hookEmitter;
