-- Slice 2: club days replace weekly opening hours and closed dates (docs/adr/0002).
DROP TABLE "OpeningHours";
DROP TABLE "ClosedDate";

ALTER TABLE "ClubSettings"
  ADD COLUMN "defaultOpenTime" TEXT NOT NULL DEFAULT '12:00',
  ADD COLUMN "defaultCloseTime" TEXT NOT NULL DEFAULT '20:00';

CREATE TABLE "ClubDay" (
    "date" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubDay_pkey" PRIMARY KEY ("date")
);

-- Working hours: "HH:mm" opening before "HH:mm" closing, closing "24:00" at the latest.
-- Zero-padded times compare correctly as text.
ALTER TABLE "ClubSettings" ADD CONSTRAINT "ClubSettings_default_hours"
  CHECK (
    "defaultOpenTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "defaultCloseTime" ~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
    AND "defaultOpenTime" < "defaultCloseTime"
  );

ALTER TABLE "ClubDay" ADD CONSTRAINT "ClubDay_hours"
  CHECK (
    "openTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    AND "closeTime" ~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
    AND "openTime" < "closeTime"
  );
