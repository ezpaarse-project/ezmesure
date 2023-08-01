const institutionsService = require('../../entities/institutions.service');

exports.getSubInstitutions = async (ctx) => {
  const { include: propsToInclude } = ctx.query;
  let include;

  if (Array.isArray(propsToInclude)) {
    include = Object.fromEntries(propsToInclude.map((prop) => [prop, true]));
  }

  const subInstitutions = await institutionsService.findMany({
    where: { parentInstitutionId: ctx.state.institution.id },
    include,
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = Array.isArray(subInstitutions) ? subInstitutions : [];
};

exports.addSubInstitution = async (ctx) => {
  const { institution } = ctx.state;
  const { subInstitutionId } = ctx.params;

  const newInstitution = await institutionsService.update({
    where: { id: institution.id },
    include: { childInstitutions: true },
    data: {
      childInstitutions: {
        connect: { id: subInstitutionId },
      },
    },

  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = newInstitution;
};

exports.removeSubInstitution = async (ctx) => {
  const { institution } = ctx.state;
  const { subInstitutionId } = ctx.params;

  const newInstitution = await institutionsService.update({
    where: { id: institution.id },
    include: { childInstitutions: true },
    data: {
      childInstitutions: {
        disconnect: { id: subInstitutionId },
      },
    },

  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = newInstitution;
};
