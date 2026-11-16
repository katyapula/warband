-- Slice 6: booking columns (docs/DOMAIN.md → "Migrations from the init schema").

ALTER TABLE "Booking" RENAME COLUMN "walkInPhone" TO "walkInContact";

ALTER TABLE "Booking"
  DROP COLUMN "statusReason",
  DROP COLUMN "editedByAdminAt",
  DROP COLUMN "editReason",
  DROP COLUMN "isWholeDay",
  ADD COLUMN "adminComment" TEXT,
  ALTER COLUMN "status" DROP DEFAULT;

CREATE INDEX "Booking_startsAt_idx" ON "Booking"("startsAt");
