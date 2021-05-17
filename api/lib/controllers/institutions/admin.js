
exports.getInstitutionState = async (ctx) => {
  const { institution } = ctx.state;

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    space: await institution.getSpace(),
    indices: await institution.getIndices(),
    indexPatterns: await institution.getIndexPatterns(),
    roles: await institution.checkRoles(),
  };
};
