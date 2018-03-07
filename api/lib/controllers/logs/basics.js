const elasticsearch = require('../../services/elastic');

exports.list = async function (ctx) {
  ctx.type = 'json';
  ctx.body = await elasticsearch.indices.stats({
    metric: 'docs',
    headers: { 'es-security-runas-user': ctx.state.user.username }
  });
};

exports.del = async function (ctx, index) {
  const username  = ctx.state.user.username;
  const perm      = await elasticsearch.hasPrivileges(username, [index], ['delete_index']);
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index]['delete_index'];

  if (!canDelete) {
    return ctx.throw(`you don't have permission to delete ${index}`, 403);
  }

  ctx.type = 'json';
  ctx.body = await elasticsearch.indices.delete({
    index,
    headers: { 'es-security-runas-user': username }
  });
};
