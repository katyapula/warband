-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClubSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningHours" (
    "id" TEXT NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,

    CONSTRAINT "OpeningHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosedDate" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "ClosedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isWholeDay" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "userId" TEXT,
    "walkInName" TEXT,
    "walkInPhone" TEXT,
    "editedByAdminAt" TIMESTAMP(3),
    "editReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpeningHours_settingsId_weekday_key" ON "OpeningHours"("settingsId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "ClosedDate_date_key" ON "ClosedDate"("date");

-- CreateIndex
CREATE INDEX "Booking_tableId_startsAt_idx" ON "Booking"("tableId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "ClubSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A booking belongs to exactly one of: a member (userId) or a walk-in (walkInName).
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_member_xor_walk_in"
  CHECK (("userId" IS NOT NULL) <> ("walkInName" IS NOT NULL));

-- Only weekdays 0 (Monday) … 6 (Sunday).
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_weekday_range"
  CHECK ("weekday" BETWEEN 0 AND 6);

-- A booking ends after it starts.
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ends_after_starts"
  CHECK ("endsAt" > "startsAt");
