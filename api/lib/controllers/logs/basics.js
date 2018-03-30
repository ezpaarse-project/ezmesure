const elasticsearch = require('../../services/elastic');

exports.list = async function (ctx) {
  ctx.action = 'indices/list';
  ctx.type = 'json';
  ctx.body = await elasticsearch.indices.stats({
    metric: 'docs',
    headers: { 'es-security-runas-user': ctx.state.user.username }
  });
};

exports.del = async function (ctx, index) {
  ctx.action = 'indices/delete';
  ctx.index = index;
  const username  = ctx.state.user.username;
  const perm      = await elasticsearch.hasPrivileges(username, [index], ['delete_index']);
  const canDelete = perm && perm.index && perm.index[index] && perm.index[index]['delete_index'];

  if (!canDelete) {
    return ctx.throw(403, `you don't have permission to delete ${index}`);
  }

  ctx.type = 'json';
  ctx.body = await elasticsearch.indices.delete({
    index,
    headers: { 'es-security-runas-user': username }
  });
};
