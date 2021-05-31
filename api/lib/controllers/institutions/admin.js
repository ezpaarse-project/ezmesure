
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
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet', institution.id));
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
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet', institution.id));
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
  const { body = {} } = ctx.request;
  const { suffix } = body || {};

  if (!institution.get('space')) {
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet', institution.id));
  }
  if (!institution.get('indexPrefix')) {
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet', institution.id));
  }

  const space = await institution.getSpace();
  if (!space) {
    ctx.throw(409, ctx.$t('errors.institution.noSpace', institution.get('space'), institution.id));
  }

  const patterns = await institution.getIndexPatterns({ suffix: suffix || '*' });

  if (patterns.length > 0) {
    const pattern = patterns[0] && patterns[0].title;
    ctx.throw(409, ctx.$t('errors.institution.patternExists', pattern));
  }

  await institution.createIndexPattern({ suffix: suffix || '*' });
  ctx.status = 201;
  ctx.body = { message: ctx.$t('indexPatternCreated') };
};

exports.createInstitutionRoles = async (ctx) => {
  const { institution } = ctx.state;

  if (!institution.get('space')) {
    ctx.throw(409, ctx.$t('errors.institution.noSpaceSet', institution.id));
  }
  if (!institution.get('indexPrefix')) {
    ctx.throw(409, ctx.$t('errors.institution.noPrefixSet', institution.id));
  }
  if (!institution.get('role')) {
    ctx.throw(409, ctx.$t('errors.institution.noRoleSet', institution.id));
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
