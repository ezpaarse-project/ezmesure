const hookEmitter = require('./hookEmitter');

// Import various hooks here
require('./ezreeport');
require('./elastic');
require('./kibana');

module.exports = hookEmitter;
