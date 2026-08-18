const hookEmitter = require('./hookEmitter');

// Import various hooks here
require('./ezreeport');
require('./elastic');
require('./kibana');
require('./harvest');
require('./users');
require('./api-keys');
require('./onboarding');
require('./emails');

module.exports = hookEmitter;
