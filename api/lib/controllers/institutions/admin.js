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
