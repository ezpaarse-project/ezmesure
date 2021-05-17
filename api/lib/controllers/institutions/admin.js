
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

exports.validateInstitution = async (ctx) => {
  const { body = {} } = ctx.request;
  const { value: validated } = body;
  const { institution } = ctx.state;

  institution.setValidation(validated);
  await institution.save();

  ctx.status = 200;
  ctx.body = institution;
};

