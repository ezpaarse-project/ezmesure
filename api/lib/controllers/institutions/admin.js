const config = require('config');
const kibana = require('../../services/kibana');

const { sendMail, generateMail } = require('../../services/mail');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

const { appLogger } = require('../../services/logger');
const InstitutionsService = require('../../entities/institutions.service');
const UsersService = require('../../entities/users.service');

const { MEMBER_ROLES } = require('../../entities/memberships.dto');

function sendValidateInstitution(receivers) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supportRecipients,
    subject: 'Votre établissement a été validé',
    ...generateMail('validated-institution'),
  });
}

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

  const wasValidated = institution.validated;

  const updatedInstitution = await InstitutionsService.update({
    where: { id: institution.id },
    data: { validated },
  });

  if (!wasValidated && validated === true) {
    let contacts = await UsersService.findMany({
      where: {
        memberships: {
          some: {
            institutionId: institution.id,
            roles: { hasSome: [MEMBER_ROLES.docContact, MEMBER_ROLES.techContact] },
          },
        },
      },
    });

    contacts = contacts?.map?.((e) => e.email);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitution(contacts);
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  ctx.status = 200;
  ctx.body = updatedInstitution;
};
