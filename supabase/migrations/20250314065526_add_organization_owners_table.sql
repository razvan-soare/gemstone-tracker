-- Create organization_owners table to store organization-specific owner values
CREATE TABLE IF NOT EXISTS "public"."organization_owners" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organization_owners_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_owners_organization_id_name_key" UNIQUE ("organization_id", "name"),
  CONSTRAINT "organization_owners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE
);

-- Add RLS policies to allow organization members to manage owners
CREATE POLICY "Organization members can manage owners" ON "public"."organization_owners"
  USING (EXISTS (
    SELECT 1 FROM "public"."organization_members"
    WHERE "organization_members"."organization_id" = "organization_owners"."organization_id"
    AND "organization_members"."user_id" = auth.uid()
  ));

-- Add trigger for updated_at column
CREATE TRIGGER "update_organization_owners_updated_at"
  BEFORE UPDATE ON "public"."organization_owners"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable RLS on the table
ALTER TABLE "public"."organization_owners" ENABLE ROW LEVEL SECURITY;

-- Add any existing custom owner values from stones table
INSERT INTO "public"."organization_owners" ("organization_id", "name")
SELECT DISTINCT "organization_id", "owner" 
FROM "public"."stones" 
WHERE "owner" IS NOT NULL 
  AND "owner" NOT IN ('Nuo', 'Han', 'Hulu')
  AND "organization_id" IS NOT NULL
ON CONFLICT DO NOTHING;
