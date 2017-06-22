import elasticsearch from 'elasticsearch';
import config from 'config';
import template from '../utils/index-template';

const apiVersion = config.get('elasticsearch.apiVersion');
const api = elasticsearch.Client.apis[apiVersion];

api.findUser = function (name) {
  return this.transport.request({
    method: 'GET',
    path: `/_xpack/security/user/${name}`
  }).then(res => {
    return res && res[name];
  }).catch(e => {
    return e.status === 404 ? null : Promise.reject(e);
  });
}

api.updateUser = function (name, props) {
  return this.transport.request({
    method: 'PUT',
    path: `/_xpack/security/user/${name}`,
    body: props
  });
}

api.updateUserPassword = function (name, password) {
  return this.transport.request({
    method: 'PUT',
    path: `/_xpack/security/user/${name}/_password`,
    body: { password }
  });
}

api.deleteUser = function (name) {
  return this.transport.request({
    method: 'DELETE',
    path: `/_xpack/security/user/${name}`
  });
};

const elastic = new elasticsearch.Client({
  host: `${config.get('elasticsearch.host')}:${config.get('elasticsearch.port')}`,
  httpAuth: `${config.get('elasticsearch.user')}:${config.get('elasticsearch.password')}`,
  apiVersion
});

elastic.indices.putTemplate({
  name: 'main',
  order: '0',
  body: template
});

export default elastic;
