


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "protected" boolean DEFAULT false
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "member_id" "uuid",
    "name" "text" NOT NULL,
    "is_leader" boolean DEFAULT false,
    "joined_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."group_members"."member_id" IS 'nullable — links if member has account';



COMMENT ON COLUMN "public"."group_members"."name" IS 'denormalised snapshot';



CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


COMMENT ON COLUMN "public"."groups"."type" IS 'led / collective';



CREATE TABLE IF NOT EXISTS "public"."item_units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid",
    "serial_number" "text",
    "condition" "text" DEFAULT 'Good'::"text",
    "condition_notes" "text",
    "acquired_at" timestamp without time zone,
    "retired_at" timestamp without time zone
);


ALTER TABLE "public"."item_units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text",
    "quantity" integer DEFAULT 0 NOT NULL,
    "total_owned" integer DEFAULT 0 NOT NULL,
    "track_individual" boolean DEFAULT false,
    "image_url" "text",
    "removed" boolean DEFAULT false,
    "removed_reason" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone,
    "category_id" "uuid"
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "item_id" "uuid",
    "qty" integer,
    "unit" "text",
    "requester_id" "uuid" NOT NULL,
    "checker_id" "uuid" NOT NULL,
    "event" "text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."log" OWNER TO "postgres";


COMMENT ON TABLE "public"."log" IS 'This is a duplicate of log';



COMMENT ON COLUMN "public"."log"."type" IS 'OUT / IN / ADD / WRITEOFF / DELETE';



COMMENT ON COLUMN "public"."log"."requester_id" IS 'nullable';



COMMENT ON COLUMN "public"."log"."checker_id" IS 'nullable';



CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "joined_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."members"."auth_user_id" IS 'links to Supabase Auth';



COMMENT ON COLUMN "public"."members"."role" IS 'quartermaster / assistant_qm / scout';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid",
    "item_unit_id" "uuid",
    "group_id" "uuid",
    "qty" integer NOT NULL,
    "requester_id" "uuid",
    "requester_name" "text",
    "checkout_checker_id" "uuid",
    "checkout_checker_name" "text",
    "event" "text",
    "checkout_remarks" "text",
    "checked_out_at" timestamp without time zone NOT NULL,
    "returner_id" "uuid",
    "returner_name" "text",
    "return_checker_id" "uuid",
    "return_checker_name" "text",
    "condition" "text",
    "return_remarks" "text",
    "returned_at" timestamp without time zone
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."transactions"."item_unit_id" IS 'nullable';



COMMENT ON COLUMN "public"."transactions"."group_id" IS 'nullable';



COMMENT ON COLUMN "public"."transactions"."requester_name" IS 'denormalised snapshot ✦';



COMMENT ON COLUMN "public"."transactions"."checkout_checker_name" IS 'denormalised snapshot ✦';



COMMENT ON COLUMN "public"."transactions"."returner_id" IS 'nullable';



COMMENT ON COLUMN "public"."transactions"."returner_name" IS 'denormalised snapshot ✦';



COMMENT ON COLUMN "public"."transactions"."return_checker_id" IS 'nullable';



COMMENT ON COLUMN "public"."transactions"."return_checker_name" IS 'denormalised snapshot ✦';



COMMENT ON COLUMN "public"."transactions"."returned_at" IS 'null = still outstanding';



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_units"
    ADD CONSTRAINT "item_units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_units"
    ADD CONSTRAINT "item_units_serial_number_key" UNIQUE ("serial_number");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_duplicate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."item_units"
    ADD CONSTRAINT "item_units_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_duplicate_checker_id_fkey" FOREIGN KEY ("checker_id") REFERENCES "public"."members"("id");



ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_duplicate_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_duplicate_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."members"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_checkout_checker_id_fkey" FOREIGN KEY ("checkout_checker_id") REFERENCES "public"."members"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_item_unit_id_fkey" FOREIGN KEY ("item_unit_id") REFERENCES "public"."item_units"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."members"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_return_checker_id_fkey" FOREIGN KEY ("return_checker_id") REFERENCES "public"."members"("id") DEFERRABLE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_returner_id_fkey" FOREIGN KEY ("returner_id") REFERENCES "public"."members"("id") DEFERRABLE;



CREATE POLICY "Authenticated users have full access" ON "public"."categories" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."group_members" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."groups" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."item_units" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."log" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."members" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access" ON "public"."transactions" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."item_units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."item_units" TO "anon";
GRANT ALL ON TABLE "public"."item_units" TO "authenticated";
GRANT ALL ON TABLE "public"."item_units" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."log" TO "anon";
GRANT ALL ON TABLE "public"."log" TO "authenticated";
GRANT ALL ON TABLE "public"."log" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































