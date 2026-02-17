/*
  Warnings:

  - You are about to drop the column `roles` on the `Membership` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "restricted" BOOLEAN NOT NULL DEFAULT true,
    "notifications" TEXT[],
    "autoAssign" TEXT[],
    "exposed" BOOLEAN NOT NULL DEFAULT false,
    "permissionsPreset" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipRole" (
    "username" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "MembershipRole_pkey" PRIMARY KEY ("username","institutionId","roleId")
);

-- AddForeignKey
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_username_institutionId_fkey" FOREIGN KEY ("username", "institutionId") REFERENCES "Membership"("username", "institutionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create role entries for legacy roles
INSERT INTO "Role" (
  "id",
  "label",
  "icon",
  "color",
  "restricted",
  "exposed",
  "createdAt",
  "updatedAt",
  "permissionsPreset",
  "autoAssign",
  "notifications"
) VALUES
('contact_doc', 'Contact documentaire', 'mdi-book-open-variant', '#4363D8', '1', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"sushi": "write", "spaces": "write", "reporting": "write", "institution": "write", "memberships": "write", "repositories": "read"}', '{}', '{"institution:validated","institution:new_user_matching_institution","institution:membership_request","institution:role_assigned","counter:new_data_available"}'),
('contact_tech', 'Contact technique', 'mdi-wrench', '#3CB44B', '1', '1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"sushi": "write", "spaces": "write", "reporting": "write", "institution": "write", "memberships": "write", "repositories": "write"}', '{}', '{"institution:validated","institution:new_user_matching_institution","institution:membership_request","institution:role_assigned","counter:new_data_available"}'),
('guest', 'Invité', 'mdi-handshake', '#555555', '0', '0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"spaces": "read", "institution": "read", "repositories": "read"}', '{"institution:user_onboarded"}', '{}');

-- Transform legacy roles into MembershipRole entries
INSERT INTO "MembershipRole" ("username", "institutionId", "roleId") SELECT "username", "institutionId", 'contact_doc' AS "roleId" FROM "Membership" WHERE 'contact:doc' = ANY("roles");
INSERT INTO "MembershipRole" ("username", "institutionId", "roleId") SELECT "username", "institutionId", 'contact_tech' AS "roleId" FROM "Membership" WHERE 'contact:tech' = ANY("roles");
INSERT INTO "MembershipRole" ("username", "institutionId", "roleId") SELECT "username", "institutionId", 'guest' AS "roleId" FROM "Membership" WHERE 'guest' = ANY("roles");

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "roles";
