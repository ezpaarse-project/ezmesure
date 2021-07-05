const kibana = require('../../services/kibana');

exports.getInstitutionState = async (ctx) => {
  const { institution } = ctx.state;

  const spaces = await institution.getSpaces();

  const patterns = await Promise.all(
    spaces
      .filter((space) => space && space.id)
      .map((space) => kibana.getIndexPatterns({ spaceId: space.id, perPage: 1000 })),
  );

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    spaces,
    indices: await institution.getIndices(),
    indexPatterns: patterns.reduce((acc, current) => [...acc, ...current], []),
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
