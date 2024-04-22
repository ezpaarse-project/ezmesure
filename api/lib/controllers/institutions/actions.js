const config = require('config');

const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');
const InstitutionsService = require('../../entities/institutions.service');
const UsersService = require('../../entities/users.service');
const ImagesService = require('../../services/images');
const SushiCredentialsService = require('../../entities/sushi-credentials.service');
const MembershipsService = require('../../entities/memberships.service');
const RepositoriesService = require('../../entities/repositories.service');
const SpacesService = require('../../entities/spaces.service');

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.InstitutionCreateInput} InstitutionCreateInput
 * @typedef {import('@prisma/client').Prisma.InstitutionFindManyArgs} InstitutionFindManyArgs
 * @typedef {import('@prisma/client').Prisma.RepositoryCreateOrConnectWithoutInstitutionsInput} RepositoryCreateOrConnectWithoutInstitutionsInput
 * @typedef {import('@prisma/client').Prisma.SpaceCreateOrConnectWithoutInstitutionInput} SpaceCreateOrConnectWithoutInstitutionInput
 * @typedef {import('@prisma/client').Prisma.MembershipCreateOrConnectWithoutInstitutionInput} MembershipCreateOrConnectWithoutInstitutionInput
 * @typedef {import('@prisma/client').Prisma.SushiCredentialsCreateOrConnectWithoutInstitutionInput} SushiCredentialsCreateOrConnectWithoutInstitutionInput
 * @typedef {import('@prisma/client').Prisma.RepositoryPermissionCreateOrConnectWithoutMembershipInput} RepositoryPermissionCreateOrConnectWithoutMembershipInput
 * @typedef {import('@prisma/client').Prisma.SpacePermissionCreateOrConnectWithoutMembershipInput} SpacePermissionCreateOrConnectWithoutMembershipInput
*/
/* eslint-enable max-len */

const {
  adminCreateSchema,
  adminUpdateSchema,
  createSchema,
  updateSchema,
  adminImportSchema,
  includableFields,
} = require('../../entities/institutions.dto');
const {
  includableFields: membershipIncludableFields,
} = require('../../entities/memberships.dto');
const {
  includableFields: repositoryIncludableFields,
} = require('../../entities/repositories.dto');
const {
  includableFields: spaceIncludableFields,
} = require('../../entities/repositories.dto');

const { propsToPrismaInclude } = require('../utils');

const {
  PERMISSIONS,
  MEMBER_ROLES: {
    docContact: DOC_CONTACT,
    techContact: TECH_CONTACT,
  },
  upsertSchema: membershipUpsertSchema,
  adminUpsertSchema: membershipAdminUpsertSchema,
} = require('../../entities/memberships.dto');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

function sendValidateInstitution(receivers, data) {
  return sendMail({
    from: sender,
    to: receivers,
    cc: supportRecipients,
    subject: 'Votre établissement a été validé',
    ...generateMail('validate-institution', data),
  });
}

function sendNewContact(receiver, institutionName) {
  const data = {
    contactBlogLink: 'https://blog.ezpaarse.org/2022/02/correspondants-ezmesure-votre-nouveau-role/',
    institution: institutionName,
  };

  return sendMail({
    from: sender,
    to: receiver,
    cc: supportRecipients,
    subject: `Vous êtes correspondant de ${institutionName}`,
    ...generateMail('new-contact', { data }),
  });
}

exports.getInstitutions = async (ctx) => {
  const {
    include: propsToInclude,
    q: query,
    validated,
    size,
    sort,
    order = 'asc',
    page = 1,
  } = ctx.query;

  let include;
  if (ctx.state?.user?.isAdmin) {
    include = propsToPrismaInclude(propsToInclude, includableFields);
  }

  /** @type {InstitutionFindManyArgs} */
  const options = {
    include,
    take: Number.isInteger(size) && size >= 0 ? size : undefined,
    skip: Number.isInteger(size) ? size * (page - 1) : undefined,
    where: {},
  };

  if (sort) {
    options.orderBy = { [sort]: order };
  }

  if (query) {
    options.where.name = {
      contains: query,
      mode: 'insensitive',
    };
  }

  if (validated != null) {
    options.where.validated = {
      equals: validated,
    };
  }

  const institutionsService = new InstitutionsService();

  ctx.type = 'json';
  ctx.body = await institutionsService.findMany(options);
};

exports.getInstitution = async (ctx) => {
  const {
    include: propsToInclude,
  } = ctx.query;
  const { institutionId } = ctx.params;

  let include;
  if (ctx.state?.user?.isAdmin) {
    include = propsToPrismaInclude(propsToInclude, includableFields);
  }

  const institutionsService = new InstitutionsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await institutionsService.findUnique({
    where: { id: institutionId },
    include,
  });
};

exports.createInstitution = async (ctx) => {
  ctx.action = 'institutions/create';
  const { user } = ctx.state;
  const { body } = ctx.request;
  const { addAsMember } = ctx.query;
  const { username, isAdmin } = user;
  let memberships;

  ctx.metadata = {
    institutionName: body?.name,
  };

  const schema = isAdmin ? adminCreateSchema : createSchema;
  const { error, value: institutionData } = schema.validate(body);

  if (error) { ctx.throw(error); }

  if (!isAdmin || addAsMember !== false) {
    memberships = {
      create: [{
        username,
        permissions: [...PERMISSIONS],
        roles: [DOC_CONTACT, TECH_CONTACT],
        locked: true,
      }],
    };
  }

  const institutionsService = new InstitutionsService();

  if (body?.logo) {
    institutionData.logoId = await ImagesService.storeLogo(body.logo);
  }

  const institution = await institutionsService.create({
    data: { ...institutionData, memberships },
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

  if (institutionData.logo) {
    institutionData.logoId = await ImagesService.storeLogo(institutionData.logo);
  }

  // FIXME: handle admin restricted fields
  const updatedInstitution = await institutionsService.update({
    where: { id: institution.id },
    data: {
      ...institutionData,
      logo: undefined,
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
          hasSome: [DOC_CONTACT, TECH_CONTACT],
        },
      },
      include: { user: true },
    });

    const contacts = contactMemberships?.map?.((m) => m.user.email);

    if (Array.isArray(contacts) && contacts.length > 0) {
      try {
        await sendValidateInstitution(contacts, {
          manageMemberLink: `${origin}/institutions/self/memberships`,
          manageSushiLink: `${origin}/institutions/self/sushi`,
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
    sendMail({
      from: sender,
      to: supportRecipients,
      subject: sushiReadySince ? 'Fin de saisie SUSHI' : 'Reprise de saisie SUSHI',
      ...generateMail('sushi-ready-change', {
        institutionName: institution.name,
        institutionSushiLink: `${origin}/institutions/${institution.id}/sushi`,
        sushiReadySince,
      }),
    }).catch((err) => {
      appLogger.error(`Failed to send sushi-ready-change mail: ${err}`);
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
              ...(membership ?? {}),
              username: undefined,
              institutionId: undefined,

              user: {
                connect: { username: membership?.username },
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

exports.getInstitutionRepositories = async (ctx) => {
  const { include: propsToInclude } = ctx.query;

  const repositoriesService = new RepositoriesService();

  const repositories = await repositoriesService.findMany({
    where: { institutions: { some: { id: ctx.state.institution.id } } },
    include: propsToPrismaInclude(propsToInclude, repositoryIncludableFields),
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(repositories) ? repositories : [];
};

exports.getInstitutionSpaces = async (ctx) => {
  const { include: propsToInclude } = ctx.query;

  const spacesService = new SpacesService();

  const spaces = await spacesService.findMany({
    where: { institutionId: ctx.state.institution.id },
    include: propsToPrismaInclude(propsToInclude, spaceIncludableFields),
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(spaces) ? spaces : [];
};

exports.getInstitutionMember = async (ctx) => {
  const { institutionId, username } = ctx.params;
  const { include: propsToInclude } = ctx.query;

  const membershipsService = new MembershipsService();

  const membership = await membershipsService.findUnique({
    where: {
      username_institutionId: { institutionId, username },
    },
    include: propsToPrismaInclude(propsToInclude, membershipIncludableFields),
  });

  if (!membership) {
    ctx.throw(404, ctx.$t('errors.member.notFound'));
  }

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = membership;
};

exports.getInstitutionMembers = async (ctx) => {
  const { include: propsToInclude } = ctx.query;

  const membershipsService = new MembershipsService();

  const memberships = await membershipsService.findMany({
    where: { institutionId: ctx.state.institution.id },
    include: propsToPrismaInclude(propsToInclude, membershipIncludableFields),
  });

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(memberships) ? memberships : [];
};

exports.getInstitutionContacts = async (ctx) => {
  const members = await ctx.state.institution.getContacts();

  ctx.type = 'json';
  ctx.status = 200;

  ctx.body = Array.isArray(members) ? members : [];
};

exports.addInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/addMember';

  const {
    institution,
    user: connectedUser,
  } = ctx.state;
  const { username } = ctx.params;
  const {
    id: institutionId,
    name: institutionName,
  } = institution;

  const schema = connectedUser?.isAdmin ? membershipAdminUpsertSchema : membershipUpsertSchema;
  const { value: body } = schema.validate({
    ...ctx.request.body,
    institutionId,
    username,
  });

  ctx.metadata = {
    institutionId,
    institutionName,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    include: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const { roles } = body;
  const membership = user.memberships?.[0];
  const memberIsContact = membership?.roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);
  const memberBecomesContact = roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  const membershipData = {
    ...body,
    user: { connect: { username } },
    institution: { connect: { id: institutionId } },
  };

  const newMembership = await membershipsService.upsert({
    where: {
      username_institutionId: { username, institutionId },
    },
    include: {
      repositoryPermissions: true,
      spacePermissions: true,
      user: true,
    },
    create: membershipData,
    update: membershipData,
  });
  appLogger.info(`Membership between user [${username}] and institution [${institutionId}] is upserted`);

  if (user.email && !memberIsContact && memberBecomesContact) {
    try {
      await sendNewContact(user.email, institutionName);
    } catch (err) {
      appLogger.error(`Failed to send new contact mail: ${err}`);
    }
  }

  ctx.status = 200;
  ctx.body = newMembership;
};

exports.removeInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/removeMember';

  const { institution, user: connectedUser } = ctx.state;
  const { username } = ctx.params;
  const { id: institutionId } = institution;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    select: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const membership = user.memberships?.[0];

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  if (!membership) {
    ctx.status = 200;
    ctx.body = { message: ctx.$t('nothingToDo') };
    return;
  }

  try {
    await membershipsService.delete({
      where: {
        username_institutionId: { username, institutionId },
      },
    });
  } catch (e) {
    ctx.throw(500, ctx.$t('errors.user.failedToUpdateRoles'));
  }

  ctx.status = 200;
  ctx.body = { message: ctx.$t('userUpdated') };
};

exports.getSushiData = async (ctx) => {
  const { include: propsToInclude } = ctx.query;

  const sushiCredentialsService = new SushiCredentialsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = await sushiCredentialsService.findMany({
    where: {
      institutionId: ctx.state.institution.id,
    },
    include: {
      endpoint: true,
      ...propsToPrismaInclude(propsToInclude, ['harvests']),
    },
  });
};

exports.requestMembership = async (ctx) => {
  ctx.action = 'institutions/requestMembership';

  const institutionsService = new InstitutionsService();

  const members = await institutionsService.getContacts(ctx.state.institution.id);
  const emails = members.map((member) => member.user.email);
  const link = `${ctx.request.header.origin}/institutions/${ctx.state.institution.id}/members`;

  await sendMail({
    from: sender,
    to: emails || supportRecipients,
    cc: supportRecipients,
    subject: 'Un utilisateur souhaite rejoindre votre établissement',
    ...generateMail('request-membership', {
      user: ctx.state.user.username,
      institution: ctx.state.institution.name,
      linkInstitution: link,
    }),
  });

  ctx.type = 'json';
  ctx.status = 204;
};
