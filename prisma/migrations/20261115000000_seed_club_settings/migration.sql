-- Opening hours are either closed (no times) or open with "HH:mm" times,
-- opening before closing, closing at "24:00" (midnight) at the latest.
ALTER TABLE "OpeningHours" ADD CONSTRAINT "OpeningHours_shape"
  CHECK (
    ("isClosed" AND "openTime" IS NULL AND "closeTime" IS NULL)
    OR (
      NOT "isClosed"
      AND "openTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "closeTime" ~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$'
      AND "openTime" < "closeTime"
    )
  );

-- The single club row and a starting weekly schedule (12:00–22:00 every day).
-- Admins replace these on the Settings page.
INSERT INTO "ClubSettings" ("id", "name", "location", "description", "updatedAt")
VALUES (1, 'Warband', '', '', NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "OpeningHours" ("id", "settingsId", "weekday", "isClosed", "openTime", "closeTime")
SELECT gen_random_uuid()::text, 1, d, false, '12:00', '22:00'
FROM generate_series(0, 6) AS d
ON CONFLICT ("settingsId", "weekday") DO NOTHING;
