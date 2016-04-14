import elasticsearch from '../../services/elastic';

export default function* list() {
  this.type = 'json';
  this.body = yield elasticsearch.indices.stats({ metric: 'docs' });
};
