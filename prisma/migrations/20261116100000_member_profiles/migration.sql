-- Slice 4: member profiles and the MEMBER role (docs/DOMAIN.md → "Migrations from the init schema").

-- Role.USER → MEMBER
ALTER TYPE "Role" RENAME VALUE 'USER' TO 'MEMBER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- Profile fields. The old Google `name` becomes both the full name and the username.
ALTER TABLE "User"
  ADD COLUMN "fullName" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "telegram" TEXT,
  ADD COLUMN "adminNotes" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User" SET "fullName" = NULLIF(BTRIM("name"), '');

ALTER TABLE "User" RENAME COLUMN "name" TO "username";

-- Backfill usernames: trimmed, at most 30 characters, and unique ignoring case
-- ("Katya", "Katya 2", …). The app enforces the character rules on later edits.
UPDATE "User" u
SET "username" = CASE
    WHEN d.n = 1 THEN d.base
    ELSE LEFT(d.base, 30 - LENGTH(' ' || d.n)) || ' ' || d.n
  END
FROM (
  SELECT id,
         base,
         ROW_NUMBER() OVER (PARTITION BY LOWER(base) ORDER BY id) AS n
  FROM (
    SELECT id, LEFT(COALESCE(NULLIF(BTRIM("username"), ''), 'member'), 30) AS base
    FROM "User"
  ) b
) d
WHERE d.id = u.id;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
