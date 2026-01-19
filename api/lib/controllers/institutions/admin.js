const { sendMail, generateMail } = require('../../services/mail');

const { appLogger } = require('../../services/logger');
const InstitutionsService = require('../../entities/institutions.service');
const UsersService = require('../../entities/users.service');

const { getNotificationRecipients, getNotificationMembershipWhere } = require('../../utils/notifications');
const { NOTIFICATION_TYPES, ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

async function sendValidateInstitution(receivers) {
  const admins = await getNotificationRecipients(
    ADMIN_NOTIFICATION_TYPES.institutionValidated,
    receivers,
  );

  return sendMail({
    to: receivers,
    bcc: admins,
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
        deletedAt: { equals: null },
        memberships: {
          some: {
            institutionId: institution.id,
            ...getNotificationMembershipWhere(NOTIFICATION_TYPES.institutionValidated),
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
