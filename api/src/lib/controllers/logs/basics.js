import elasticsearch from '../../services/elastic';

export function* list() {
  this.type = 'json';
  this.body = yield elasticsearch.indices.stats({
    metric: 'docs',
    headers: { 'es-security-runas-user': this.state.user.username }
  });
};

export function* del(index) {
  const username  = this.state.user.username;
  const perm      = yield elasticsearch.hasPrivileges(username, [index], ['delete_index']);
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index]['delete_index'];

  if (!canDelete) {
    return this.throw(`you don't have permission to delete ${index}`, 403);
  }

  this.type = 'json';
  this.body = yield elasticsearch.indices.delete({
    index,
    headers: { 'es-security-runas-user': username }
  });
};
