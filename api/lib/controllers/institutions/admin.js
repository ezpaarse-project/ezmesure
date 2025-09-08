const config = require('config');

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
    ...generateMail('validate-institution'),
  });
}

exports.validateInstitution = async (ctx) => {
  const { body = {} } = ctx.request;
  const { value: validated } = body;
  const { institution } = ctx.state;

  const wasValidated = institution.validated;

  const usersService = new UsersService();
  const institutionsService = new InstitutionsService();

  const updatedInstitution = await institutionsService.update({
    where: { id: institution.id },
    data: { validated },
  });

  if (!wasValidated && validated === true) {
    let contacts = await usersService.findMany({
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
