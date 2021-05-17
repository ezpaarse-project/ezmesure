
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

exports.createInstitutionSpace = async (ctx) => {
  const { institution } = ctx.state;

  if (!institution.get('space')) {
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet'));
  }

  let space = await institution.getSpace();

  if (space) {
    ctx.status = 200;
  } else {
    space = await institution.createSpace();
    ctx.status = 201;
  }

  ctx.body = space;
};

exports.createInstitutionIndex = async (ctx) => {
  const { institution } = ctx.state;

  if (!institution.get('indexPrefix')) {
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet'));
  }

  const indexExists = await institution.checkBaseIndex();

  if (indexExists) {
    ctx.status = 200;
    ctx.body = { message: ctx.$t('nothingToDo') };
  } else {
    await institution.createBaseIndex();
    ctx.status = 201;
    ctx.body = { message: ctx.$t('indexCreated') };
  }
};

exports.createInstitutionIndexPattern = async (ctx) => {
  const { institution } = ctx.state;

  if (!institution.get('space')) {
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet'));
  }
  if (!institution.get('indexPrefix')) {
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet'));
  }

  const indexExists = await institution.checkBaseIndex();
  if (!indexExists) {
    ctx.throw(409, ctx.$t('errors.institution.noBaseIndex'));
  }

  const space = await institution.getSpace();
  if (!space) {
    ctx.throw(409, ctx.$t('errors.institution.noSpace'));
  }

  await institution.createIndexPattern();
  ctx.status = 200;
};

exports.createInstitutionRoles = async (ctx) => {
  const { institution } = ctx.state;

  if (!institution.get('space')) {
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet'));
  }
  if (!institution.get('indexPrefix')) {
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet'));
  }
  if (!institution.get('role')) {
    ctx.throw(409, ctx.$t('errors.institution.noRoleSet'));
  }

  ctx.status = 200;
  ctx.body = await institution.createRoles();
};

exports.migrateInstitutionCreator = async (ctx) => {
  const { institution } = ctx.state;

  if (institution.get('creator')) {
    await institution.migrateCreator();
    ctx.body = { message: ctx.$t('creatorMigrated') };
  } else {
    ctx.body = { message: ctx.$t('nothingToDo') };
  }

  ctx.status = 200;
};
