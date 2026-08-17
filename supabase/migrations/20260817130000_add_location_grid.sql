-- Spatial layout for storeroom locations.
--
-- Each location occupies a rectangle on a fixed-width grid, so the room can be
-- drawn as a simple schematic without needing a floor plan image. Defaults are
-- non-null so every existing and future location is placeable without a
-- backfill — a new location lands at the origin until it is arranged.

ALTER TABLE "public"."locations"
    ADD COLUMN IF NOT EXISTS "grid_x" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "grid_y" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "grid_w" integer DEFAULT 1 NOT NULL,
    ADD COLUMN IF NOT EXISTS "grid_h" integer DEFAULT 1 NOT NULL;

-- A zero or negative span would render an invisible, unclickable section.
ALTER TABLE "public"."locations"
    ADD CONSTRAINT "locations_grid_size_positive"
    CHECK ("grid_w" > 0 AND "grid_h" > 0);

ALTER TABLE "public"."locations"
    ADD CONSTRAINT "locations_grid_origin_non_negative"
    CHECK ("grid_x" >= 0 AND "grid_y" >= 0);
