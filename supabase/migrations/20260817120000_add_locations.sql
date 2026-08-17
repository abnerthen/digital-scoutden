-- Storeroom locations: where each item physically lives.
-- Modelled on `categories` so naming stays consistent and a location can be
-- renamed in one place instead of drifting across free-text values.

CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "protected" boolean DEFAULT false
);

ALTER TABLE "public"."locations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");

-- Same policy as every other table in this schema
ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users have full access" ON "public"."locations"
    USING (("auth"."role"() = 'authenticated'::"text"));

GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";

-- Nullable: existing items have no location until one is assigned, and an item
-- may legitimately have none. ON DELETE SET NULL mirrors items.category_id, so
-- removing a location leaves its items intact rather than deleting them.
ALTER TABLE "public"."items"
    ADD COLUMN IF NOT EXISTS "location_id" "uuid";

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id")
    REFERENCES "public"."locations"("id") ON DELETE SET NULL;
