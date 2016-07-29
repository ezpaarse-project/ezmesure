import providers from '../../services/providers';

export function* check() {
  this.type = 'json';
  this.body = yield providers.check();
};

export function* list() {
  this.type = 'json';
  this.body = yield providers.list();
};

export function* find(providerName) {
  this.type = 'json';
  this.body = yield providers.list(providerName);
};

export function* del(providerName) {
  this.type = 'json';
  this.body = yield providers.remove(providerName);
};

export function* register(providerName) {
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

export function* load(providerName) {
  this.type = 'json';
  this.body = yield providers.load(providerName, this.request.body);
}
