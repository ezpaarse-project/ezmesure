const config = require('config');

const { sendMail, generateMail } = require('../../services/mail');

const { appLogger } = require('../../services/logger');
const InstitutionsService = require('../../entities/institutions.service');
const UsersService = require('../../entities/users.service');

const { getNotificationRecipients, getNotificationMembershipWhere } = require('../../utils/notifications');
const { NOTIFICATION_TYPES, ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

const publicUrl = config.get('publicUrl');

async function sendValidateInstitutionMail(receivers, data) {
  try {
    const admins = await getNotificationRecipients(
      ADMIN_NOTIFICATION_TYPES.institutionValidated,
      receivers.map((receiver) => receiver.email),
    );

    return await Promise.allSettled(
      receivers.map(async (receiver) => {
        try {
          await sendMail({
            to: receiver.email,
            bcc: admins,
            ...generateMail('validate-institution', data, { locale: receiver.language }),
          });

          appLogger.verbose(`[validate-institution] Mail sent to ${receiver.email}`);
        } catch (err) {
          appLogger.error(`[validate-institution] Failed to send mail to ${receiver.email}: ${err}`);
          throw err;
        }
      }),
    );
  } catch (err) {
    appLogger.error(`[validate-institution] Failed to send sushi-ready-change mail: ${err}`);
  }
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
    const contacts = await usersService.findMany({
      where: {
        deletedAt: { equals: null },
        memberships: {
          some: {
            institutionId: institution.id,
            ...getNotificationMembershipWhere(NOTIFICATION_TYPES.institutionValidated),
          },
        },
      },
      select: {
        email: true,
        language: true,
      },
    });

    const membersUrl = new URL(`/myspace/institutions/${institution.id}/members`, publicUrl);
    const counterUrl = new URL(`/myspace/institutions/${institution.id}/sushi`, publicUrl);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitutionMail(contacts, {
          manageMemberLink: membersUrl.href,
          manageSushiLink: counterUrl.href,
        });
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  ctx.status = 200;
  ctx.body = updatedInstitution;
};
