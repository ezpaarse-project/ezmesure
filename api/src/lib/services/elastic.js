import elasticsearch from 'elasticsearch';
import config from 'config';
import template from '../utils/index-template';

const elastic = new elasticsearch.Client({
  host: `${config.get('elasticsearch.host')}:${config.get('elasticsearch.port')}`
});

elastic.indices.putTemplate({
  name: 'main',
  order: '0',
  body: template
});

export default elastic;
