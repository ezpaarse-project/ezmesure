const InstitutionsService = require('../../entities/institutions.service');
const { includableFields } = require('../../entities/institutions.dto');
const { propsToPrismaInclude } = require('../utils');

exports.getSubInstitutions = async (ctx) => {
  const { include: propsToInclude } = ctx.query;

  const institutionsService = new InstitutionsService();

  const subInstitutions = await institutionsService.findMany({
    where: { parentInstitutionId: ctx.state.institution.id },
    include: propsToPrismaInclude(propsToInclude, includableFields),
  });

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = Array.isArray(subInstitutions) ? subInstitutions : [];
};

exports.addSubInstitution = async (ctx) => {
  const { institution } = ctx.state;
  const { subInstitutionId } = ctx.params;

  const institutionsService = new InstitutionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await institutionsService.update({
    where: { id: institution.id },
    include: { childInstitutions: true },
    data: {
      childInstitutions: {
        connect: { id: subInstitutionId },
      },
    },

  });
};

exports.removeSubInstitution = async (ctx) => {
  const { institution } = ctx.state;
  const { subInstitutionId } = ctx.params;

  const institutionsService = new InstitutionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await institutionsService.update({
    where: { id: institution.id },
    include: { childInstitutions: true },
    data: {
      childInstitutions: {
        disconnect: { id: subInstitutionId },
      },
    },
  });
};
