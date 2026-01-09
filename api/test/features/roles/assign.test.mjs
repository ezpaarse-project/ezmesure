import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from 'vitest';

import ezmesure from '../../setup/ezmesure';

import { resetDatabase } from '../../../lib/services/prisma/utils';
import { resetElastic } from '../../../lib/services/elastic/utils';

import usersPrisma from '../../../lib/services/prisma/users';
import UsersService from '../../../lib/entities/users.service';
import rolesPrisma from '../../../lib/services/prisma/roles';
import institutionsPrisma from '../../../lib/services/prisma/institutions';
import membershipsRolesPrisma from '../../../lib/services/prisma/membership-roles';

describe('[roles] Assign features', () => {
  const adminUser = {
    username: 'admin.user',
    email: 'admin@test.fr',
    fullName: 'Admin',
    isAdmin: true,
  };

  const privilegedMember = {
    username: 'privileged.member',
    email: 'privileged.member@test.fr',
    fullName: 'Privileged Member',
    isAdmin: false,
  };

  const regularMember = {
    username: 'regular.member',
    email: 'regular.member@test.fr',
    fullName: 'Regular Member',
    isAdmin: false,
  };

  /** @type {import('@prisma/client').Prisma.InstitutionCreateInput} */
  const testInstitution = {
    id: 'test-institution',
    name: 'Test institution',
    memberships: {
      createMany: {
        data: [
          { username: regularMember.username, permissions: [] },
          { username: privilegedMember.username, permissions: ['memberships:write'] },
        ],
      },
    },
  };

  const restrictedRole = {
    id: 'restricted-role',
    label: 'Restricted role',
    description: 'This role can be assigned only by admins',
    restricted: true,
  };

  const unrestrictedRole = {
    id: 'unrestricted-role',
    label: 'Unrestricted role',
    description: 'This role can be assigned by any member with write permission on memberships',
    restricted: false,
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetElastic();
    await Promise.all([
      usersPrisma.create({ data: regularMember }),
      usersPrisma.create({ data: privilegedMember }),
    ]);
    await Promise.all([
      institutionsPrisma.create({ data: testInstitution }),
      rolesPrisma.create({ data: restrictedRole }),
      rolesPrisma.create({ data: unrestrictedRole }),
    ]);
  });

  beforeEach(async () => {
    await membershipsRolesPrisma.removeAll();
  });

  describe('An admin', () => {
    let adminToken;

    beforeAll(async () => {
      await usersPrisma.create({ data: adminUser });
      adminToken = await (new UsersService()).generateToken(adminUser.username);
    });

    it('#01 Should be able to assign a restricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${restrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        data: {
          roles: expect.arrayContaining([
            expect.objectContaining({ roleId: restrictedRole.id }),
          ]),
        },
      });
      expect(httpAppResponse.data.roles).toHaveLength(1);

      // Check DB state
      const membershipRoles = await membershipsRolesPrisma.findMany();
      expect(membershipRoles).toMatchObject([{
        username: regularMember.username,
        institutionId: testInstitution.id,
        roleId: restrictedRole.id,
      }]);
    });

    it('#02 Should be able to assign an unrestricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${unrestrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        data: {
          roles: expect.arrayContaining([
            expect.objectContaining({ roleId: unrestrictedRole.id }),
          ]),
        },
      });
      expect(httpAppResponse.data.roles).toHaveLength(1);

      // Check DB state
      const membershipRoles = await membershipsRolesPrisma.findMany();
      expect(membershipRoles).toMatchObject([{
        username: regularMember.username,
        institutionId: testInstitution.id,
        roleId: unrestrictedRole.id,
      }]);
    });
  });

  describe('A user with write permission on members', () => {
    let userToken;

    beforeAll(async () => {
      userToken = await (new UsersService()).generateToken(privilegedMember.username);
    });

    it('#03 Should be able to assign an unrestricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${unrestrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 200);
      expect(httpAppResponse).toMatchObject({
        data: {
          roles: expect.arrayContaining([
            expect.objectContaining({ roleId: unrestrictedRole.id }),
          ]),
        },
      });
      expect(httpAppResponse.data.roles).toHaveLength(1);

      // Check DB state
      const membershipRoles = await membershipsRolesPrisma.findMany();
      expect(membershipRoles).toMatchObject([{
        username: regularMember.username,
        institutionId: testInstitution.id,
        roleId: unrestrictedRole.id,
      }]);
    });

    it('#04 Should not be able to assign a restricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${restrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const membershipRolesCount = await membershipsRolesPrisma.count();
      expect(membershipRolesCount).toEqual(0);
    });
  });

  describe('A user without write permission on members', () => {
    let userToken;

    beforeAll(async () => {
      userToken = await (new UsersService()).generateToken(regularMember.username);
    });

    it('#04 Should not be able to assign a restricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${restrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const membershipRolesCount = await membershipsRolesPrisma.count();
      expect(membershipRolesCount).toEqual(0);
    });

    it('#04 Should not be able to assign an unrestricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${unrestrictedRole.id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 403);

      // Check DB state
      const membershipRolesCount = await membershipsRolesPrisma.count();
      expect(membershipRolesCount).toEqual(0);
    });
  });

  describe('An unauthenticated user', () => {
    it('#04 Should not be able to assign a restricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${restrictedRole.id}`,
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const membershipRolesCount = await membershipsRolesPrisma.count();
      expect(membershipRolesCount).toEqual(0);
    });

    it('#04 Should not be able to assign an unrestricted role', async () => {
      const httpAppResponse = await ezmesure({
        method: 'PUT',
        url: `/institutions/${testInstitution.id}/memberships/${regularMember.username}/roles/${unrestrictedRole.id}`,
      });

      // Test API
      expect(httpAppResponse).toHaveProperty('status', 401);

      // Check DB state
      const membershipRolesCount = await membershipsRolesPrisma.count();
      expect(membershipRolesCount).toEqual(0);
    });
  });
});
