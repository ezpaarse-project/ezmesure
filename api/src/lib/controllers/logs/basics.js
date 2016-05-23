import elasticsearch from '../../services/elastic';

export function* list() {
  this.type = 'json';
  this.body = yield elasticsearch.indices.stats({ metric: 'docs' });
};

export function* del(index) {
  this.type = 'json';
  this.body = yield elasticsearch.indices.delete({ index });
};
