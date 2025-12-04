const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');
const InstitutionsService = require('../../entities/institutions.service');
const SushiCredentialsService = require('../../entities/sushi-credentials.service');
const ImagesService = require('../../services/images');
const MembershipsService = require('../../entities/memberships.service');
const RolesService = require('../../entities/roles.service');

const { NOTIFICATION_TYPES, EVENT_TYPES } = require('../../utils/notifications/constants');

/* eslint-disable max-len */
/**
 * @typedef {import('../../.prisma/client.mjs').Prisma.InstitutionCreateInput} InstitutionCreateInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryCreateOrConnectWithoutInstitutionsInput} RepositoryCreateOrConnectWithoutInstitutionsInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpaceCreateOrConnectWithoutInstitutionInput} SpaceCreateOrConnectWithoutInstitutionInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.MembershipCreateOrConnectWithoutInstitutionInput} MembershipCreateOrConnectWithoutInstitutionInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.SushiCredentialsCreateOrConnectWithoutInstitutionInput} SushiCredentialsCreateOrConnectWithoutInstitutionInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.RepositoryPermissionCreateOrConnectWithoutMembershipInput} RepositoryPermissionCreateOrConnectWithoutMembershipInput
 * @typedef {import('../../.prisma/client.mjs').Prisma.SpacePermissionCreateOrConnectWithoutMembershipInput} SpacePermissionCreateOrConnectWithoutMembershipInput
*/
/* eslint-enable max-len */

const {
  schema: institutionSchema,
  adminCreateSchema,
  adminUpdateSchema,
  createSchema,
  updateSchema,
  adminImportSchema,
  includableFields,
} = require('../../entities/institutions.dto');

const { getNotificationRecipients } = require('../../services/notifications');
const { prepareStandardQueryParams } = require('../../services/std-query');

const standardQueryParams = prepareStandardQueryParams({
  schema: institutionSchema,
  includableFields,
  queryFields: ['name', 'acronym'],
});
exports.standardQueryParams = standardQueryParams;

const { PERMISSIONS } = require('../../entities/memberships.dto');

async function sendValidateInstitutionMail(receivers, data) {
  const admins = await getNotificationRecipients(NOTIFICATION_TYPES.institutionValidated);

  return sendMail({
    to: receivers,
    bcc: admins,
    subject: 'Votre établissement a été validé',
    ...generateMail('validate-institution', data),
  });
}

async function sendCounterReadyChangeMail(data) {
  try {
    const admins = await getNotificationRecipients(NOTIFICATION_TYPES.counterReadyChange);

    return sendMail({
      to: admins,
      subject: data.sushiReadySince ? 'Fin de saisie SUSHI' : 'Reprise de saisie SUSHI',
      ...generateMail('sushi-ready-change', data),
    });
  } catch (err) {
    appLogger.error(`Failed to send sushi-ready-change mail: ${err}`);
  }
}

exports.getInstitutions = async (ctx) => {
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  if (!ctx.state?.user?.isAdmin) {
    prismaQuery.include = undefined;
  }

  const institutionsService = new InstitutionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await institutionsService.count({ where: prismaQuery.where }));
  ctx.body = await institutionsService.findMany(prismaQuery);
};

exports.getInstitution = async (ctx) => {
  const { institutionId } = ctx.params;
  const { user } = ctx.state;
  const queryOpts = {};

  if (!user?.isAdmin && Array.isArray(ctx.query?.include)) {
    queryOpts.includableFields = ['customProps', 'customProps.field'];
    queryOpts.includeFilters = { customProps: { field: { visible: true } } };
  }

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { id: institutionId }, queryOpts);

  const institutionsService = new InstitutionsService();
  const institution = await institutionsService.findUnique(prismaQuery);

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notFound'));
    return;
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = institution;
};

exports.createInstitution = async (ctx) => {
  ctx.action = 'institutions/create';
  const { user } = ctx.state;
  const { body } = ctx.request;
  const { addAsMember } = ctx.query;
  const { username, isAdmin } = user;
  let memberships;
  let customProps;

  ctx.metadata = {
    institutionName: body?.name,
  };

  const schema = isAdmin ? adminCreateSchema : createSchema;
  const { error, value: institutionData } = schema.validate(body);

  if (error) { ctx.throw(error); }

  if (!isAdmin || addAsMember !== false) {
    const rolesService = new RolesService();
    const roles = await rolesService.findMany({
      select: { id: true },
      where: {
        autoAssign: { has: EVENT_TYPES.declareInstitution },
      },
    });

    memberships = {
      create: [{
        username,
        permissions: [...PERMISSIONS],
        locked: true,
        roles: {
          createMany: {
            data: roles.map((role) => ({ roleId: role.id })),
          },
        },
      }],
    };
  }

  if (isAdmin && Array.isArray(body.customProps)) {
    customProps = {
      createMany: {
        data: body.customProps.map(({ fieldId, value } = {}) => ({ fieldId, value })),
      },
    };
  }

  const institutionsService = new InstitutionsService();

  if (body?.logo) {
    institutionData.logoId = await ImagesService.storeLogo(body.logo);
  }

  const institution = await institutionsService.create({
    data: { ...institutionData, memberships, customProps },
  });
  appLogger.verbose(`Institution [${institution.id}] is created`);

  ctx.metadata.institutionId = institution.id;
  ctx.status = 201;
  ctx.body = institution;
};

exports.updateInstitution = async (ctx) => {
  ctx.action = 'institutions/update';
  const { user, institution } = ctx.state;
  const { body } = ctx.request;

  const origin = ctx.get('origin');

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
  };

  if (!body) {
    ctx.throw(400, ctx.$t('errors.emptyBody'));
    return;
  }

  const schema = user.isAdmin ? adminUpdateSchema : updateSchema;
  const { error, value: institutionData } = schema.validate(body);

  if (error) { ctx.throw(error); }

  const wasValidated = institution.validated;
  const oldLogoId = institution.logoId;
  const wasSushiReady = institution.sushiReadySince;

  const institutionsService = new InstitutionsService();
  const membershipsService = new MembershipsService();

  if (body.logo) {
    institutionData.logoId = await ImagesService.storeLogo(body.logo);
  }

  const currentCustomProps = new Map(
    (institution.customProps ?? []).map((prop) => [prop.fieldId, prop]),
  );
  const newCustomProps = new Map(
    (body.customProps ?? []).map((prop) => [prop.fieldId, prop]),
  );

  const allFieldIds = new Set([...currentCustomProps.keys(), ...newCustomProps.keys()]);

  const customProps = {
    deleteMany: [],
    upsert: [],
  };

  allFieldIds.forEach((fieldId) => {
    const currentProp = currentCustomProps.get(fieldId);
    const newProp = newCustomProps.get(fieldId);

    if (!user.isAdmin && currentProp?.field?.editable !== true) {
      return;
    }

    if (!newProp) {
      if (user.isAdmin) { customProps.deleteMany.push({ fieldId }); }
      return;
    }

    customProps.upsert.push({
      where: {
        fieldId_institutionId: {
          fieldId,
          institutionId: institution.id,
        },
      },
      create: { fieldId, value: newProp.value },
      update: { fieldId, value: newProp.value },
    });
  });

  const updatedInstitution = await institutionsService.update({
    where: { id: institution.id },
    data: {
      ...institutionData,
      logo: undefined,
      customProps,
    },
  });
  appLogger.verbose(`Institution [${institution.id}] is updated`);

  if (institutionData.logo && oldLogoId) {
    await ImagesService.remove(oldLogoId);
  }

  if (!wasValidated && institutionData.validated === true) {
    const contactMemberships = await membershipsService.findMany({
      where: {
        institutionId: ctx.state.institution.id,
        roles: {
          some: {
            role: {
              notifications: { has: NOTIFICATION_TYPES.institutionValidated },
            },
          },
        },
      },
      include: { user: true },
    });

    const contacts = contactMemberships?.map?.((m) => m.user.email);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitutionMail(contacts, {
          manageMemberLink: `${origin}/myspace/institutions/${institution.id}/memberships`,
          manageSushiLink: `${origin}/myspace/institutions/${institution.id}/sushi`,
        });
      } catch (err) {
        appLogger.error(`Failed to send validate institution mail: ${err}`);
      }
    }
  }

  const { sushiReadySince } = updatedInstitution;
  const sushiReadyChanged = (wasSushiReady && sushiReadySince === null)
    || (!wasSushiReady && sushiReadySince);

  if (sushiReadyChanged) {
    sendCounterReadyChangeMail({
      institutionName: institution.name,
      institutionSushiLink: `${origin}/myspace/institutions/${institution.id}/sushi`,
      sushiReadySince,
    });
  }

  ctx.status = 200;
  ctx.body = updatedInstitution;
};

exports.updateInstitutionSushiReady = async (ctx) => {
  ctx.action = 'institutions/update';
  const { institution } = ctx.state;
  const { body } = ctx.request;

  const origin = ctx.get('origin');

  const wasSushiReady = institution.sushiReadySince;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const updatedInstitution = await (new InstitutionsService()).update({
    where: { id: institution.id },
    data: { sushiReadySince: body.value },
  });
  appLogger.verbose(`Institution [${institution.id}] is updated`);

  const { sushiReadySince } = updatedInstitution;
  const sushiReadyChanged = (wasSushiReady && sushiReadySince === null)
    || (!wasSushiReady && sushiReadySince);

  if (sushiReadyChanged) {
    sendCounterReadyChangeMail({
      institutionName: institution.name,
      institutionSushiLink: `${origin}/myspace/institutions/${institution.id}/sushi`,
      sushiReadySince,
    });
  }

  ctx.status = 200;
  ctx.body = updatedInstitution;
};

exports.importInstitutions = async (ctx) => {
  ctx.action = 'institutions/import';
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {InstitutionsService} institutionsService
   * @param {*} itemData
   * @returns
   */
  const importItem = async (institutionsService, itemData = {}) => {
    const { value: item, error } = adminImportSchema.validate(itemData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.id) {
      const institution = await institutionsService.findUnique({
        where: { id: item.id },
      });

      if (institution && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.institution.import.alreadyExists', institution.id));
        return;
      }
    }

    /** @type {InstitutionCreateInput} */
    const institutionData = {
      ...item,
      logo: undefined,
      logoId: item.logo ? await ImagesService.storeLogo(item.logo) : item.logoId,

      customProps: {
        connectOrCreate: item.customProps?.map?.((customPropData) => ({
          where: {
            fieldId_institutionId: {
              fieldId: customPropData.fieldId,
              institutionId: customPropData.institutionId,
            },
          },
          create: {
            ...customPropData,
            institutionId: undefined,

            fieldId: undefined,
            field: {
              connect: {
                id: customPropData.fieldId,
              },
            },
          },
        })),
      },

      spaces: {
        connectOrCreate: item.spaces?.map?.((spaceData) => ({
          where: { id: spaceData.id },
          create: { ...spaceData, institutionId: undefined },
        })),
      },

      repositories: {
        connectOrCreate: item.repositories?.map?.(
          /** @returns {RepositoryCreateOrConnectWithoutInstitutionsInput} */
          (repoData) => ({
            where: {
              pattern: repoData.pattern,
            },
            create: repoData,
          }),
        ),
      },

      sushiCredentials: {
        connectOrCreate: item.sushiCredentials?.map?.(
          /** @returns {SushiCredentialsCreateOrConnectWithoutInstitutionInput} */
          (sushi) => ({
            where: { id: sushi.id },
            create: { ...sushi, institutionId: undefined },
          }),
        ),
      },

      memberships: {
        connectOrCreate: item.memberships?.map?.(
          /** @returns {MembershipCreateOrConnectWithoutInstitutionInput} */
          (membership) => ({
            where: {
              username_institutionId: {
                institutionId: item.id,
                username: membership?.username,
              },
            },
            create: {
              ...membership,
              username: undefined,
              institutionId: undefined,

              user: {
                connect: { username: membership?.username },
              },

              roles: {
                connectOrCreate: membership?.roles?.map?.(
                  (role) => ({
                    where: {
                      username_institutionId_roleId: {
                        // For legacy roles, replace : by _ (ex: contact:doc => contact_doc)
                        roleId: typeof role === 'string' ? role.replace(':', '_') : role?.roleId,
                        username: membership?.username,
                        institutionId: item.id,
                      },
                    },
                    create: typeof role === 'string' ? { roleId: role.replace(':', '_') } : {
                      ...role,
                      username: undefined,
                      institutionId: undefined,
                    },
                  }),
                ),
              },

              spacePermissions: {
                connectOrCreate: membership?.spacePermissions?.map?.(
                  /** @returns {SpacePermissionCreateOrConnectWithoutMembershipInput} */
                  (perm) => ({
                    where: {
                      username_spaceId: {
                        username: membership?.username,
                        spaceId: perm?.spaceId,
                      },
                    },
                    create: perm,
                  }),
                ),
              },

              repositoryPermissions: {
                connectOrCreate: membership?.repositoryPermissions?.map?.(
                  /** @returns {RepositoryPermissionCreateOrConnectWithoutMembershipInput} */
                  (perm) => ({
                    where: {
                      username_institutionId_repositoryPattern: {
                        username: membership?.username,
                        repositoryPattern: perm?.repositoryPattern,
                        institutionId: item.id,
                      },
                    },
                    create: perm,
                  }),
                ),
              },
            },
          }),
        ),
      },
    };

    const institution = await institutionsService.upsert({
      where: { id: item?.id },
      create: institutionData,
      update: institutionData,
    });

    addResponseItem(institution, 'created');
  };

  await InstitutionsService.$transaction(async (institutionsService) => {
    for (let i = 0; i < body.length; i += 1) {
      const institutionData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(institutionsService, institutionData);
      } catch (e) {
        addResponseItem(institutionData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.deleteInstitution = async (ctx) => {
  ctx.action = 'institutions/delete';
  const { institutionId } = ctx.params;

  const { institution } = ctx.state;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
  };

  const institutionsService = new InstitutionsService();

  const data = await institutionsService.delete({ where: { id: institutionId } });
  appLogger.verbose(`Institution [${institution?.id}] is deleted`);

  ctx.status = 200;
  ctx.body = data;
};

exports.harvestableInstitutions = async (ctx) => {
  const institutionsService = new InstitutionsService();

  const institutions = await institutionsService.findMany({
    where: {
      sushiCredentials: {
        some: {
          ...SushiCredentialsService.enabledCredentialsQuery,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
    include: {
      _count: {
        select: {
          spaces: { where: { type: 'counter5' } },
          repositories: { where: { type: 'counter5' } },
          sushiCredentials: { where: SushiCredentialsService.enabledCredentialsQuery },
          memberships: {
            where: {
              roles: {
                some: {
                  role: {
                    notifications: { has: NOTIFICATION_TYPES.newCounterDataAvailable },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const response = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const institution of institutions) {
    response.push({
      institution,
      // eslint-disable-next-line no-await-in-loop
      harvestable: await institutionsService.isHarvestable(institution.id, ctx.query),
    });
  }

  ctx.status = 200;
  ctx.body = response;
};
