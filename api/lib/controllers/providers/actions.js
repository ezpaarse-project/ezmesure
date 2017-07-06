const providers = require('../../services/providers');

exports.check = function* () {
  this.type = 'json';
  this.body = yield providers.check();
};

exports.list = function* () {
  this.type = 'json';
  this.body = yield providers.list();
};

exports.find = function* (providerName) {
  this.type = 'json';
  this.body = yield providers.list(providerName);
};

exports.del = function* (providerName) {
  this.type = 'json';
  this.body = yield providers.remove(providerName);
};

exports.register = function* (providerName) {
  const options = this.request.body;
  const mandatory = ['key', 'condition', 'target', 'field'];

  this.type = 'json';

  if (mandatory.some(p => !options[p])) {
    this.status = 400;
    return this.body = {
      error: `mandatory field missing, you must specify: ${mandatory.join(', ')}`
    };
  }

  options.name = providerName;
  this.body    = yield providers.register(providerName, options);
}

exports.load = function* (providerName) {
  this.type = 'json';
  this.body = yield providers.load(providerName, this.request.body);
}
