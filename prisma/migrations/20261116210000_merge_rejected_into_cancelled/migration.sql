-- Reject and Cancel are one action: an admin declining a pending booking
-- cancels it. Existing REJECTED bookings become CANCELLED (their admin
-- comment, if any, still says why), then REJECTED leaves the enum.

UPDATE "Booking" SET "status" = 'CANCELLED' WHERE "status" = 'REJECTED';

ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED');
ALTER TABLE "Booking"
  ALTER COLUMN "status" TYPE "BookingStatus" USING ("status"::text::"BookingStatus");
DROP TYPE "BookingStatus_old";
