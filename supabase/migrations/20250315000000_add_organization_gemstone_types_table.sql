-- Create organization_gemstone_types table to store organization-specific gemstone type values
CREATE TABLE IF NOT EXISTS "public"."organization_gemstone_types" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organization_gemstone_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_gemstone_types_organization_id_name_key" UNIQUE ("organization_id", "name"),
  CONSTRAINT "organization_gemstone_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE
);

-- Add RLS policies to allow organization members to manage gemstone types
CREATE POLICY "Organization members can manage gemstone types" ON "public"."organization_gemstone_types"
  USING (EXISTS (
    SELECT 1 FROM "public"."organization_members"
    WHERE "organization_members"."organization_id" = "organization_gemstone_types"."organization_id"
    AND "organization_members"."user_id" = auth.uid()
  ));

-- Add trigger for updated_at column
CREATE TRIGGER "update_organization_gemstone_types_updated_at"
  BEFORE UPDATE ON "public"."organization_gemstone_types"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable RLS on the table
ALTER TABLE "public"."organization_gemstone_types" ENABLE ROW LEVEL SECURITY;

-- Add gem_type_id column to stones table
ALTER TABLE "public"."stones" ADD COLUMN IF NOT EXISTS "gem_type_id" uuid;

-- Add foreign key constraint
ALTER TABLE "public"."stones" 
  ADD CONSTRAINT "stones_gem_type_id_fkey" 
  FOREIGN KEY ("gem_type_id") 
  REFERENCES "public"."organization_gemstone_types"("id") 
  ON DELETE SET NULL;

-- Seed default gemstone types from the GemstoneType enum
INSERT INTO "public"."organization_gemstone_types" ("organization_id", "name")
SELECT 
  "organizations"."id", 
  "gem_type"
FROM 
  "public"."organizations"
CROSS JOIN (
  VALUES 
    ('Ruby'),
    ('Sapphire'),
    ('Emerald'),
    ('Diamond'),
    ('Amethyst'),
    ('Aquamarine'),
    ('Topaz'),
    ('Opal'),
    ('Garnet'),
    ('Peridot'),
    ('Tanzanite'),
    ('Tourmaline'),
    ('Citrine'),
    ('Morganite'),
    ('Alexandrite'),
    ('Turquoise'),
    ('Jade'),
    ('Lapis Lazuli'),
    ('Moonstone'),
    ('Onyx'),
    ('Pearl'),
    ('Spinel'),
    ('Zircon'),
    ('Other')
) AS "gem_types"("gem_type")
ON CONFLICT DO NOTHING;

-- Import existing custom gemstone names from stones table
INSERT INTO "public"."organization_gemstone_types" ("organization_id", "name")
SELECT DISTINCT "organization_id", "name" 
FROM "public"."stones" 
WHERE "name" IS NOT NULL 
  AND "name" NOT IN (
    'Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Amethyst', 
    'Aquamarine', 'Topaz', 'Opal', 'Garnet', 'Peridot', 
    'Tanzanite', 'Tourmaline', 'Citrine', 'Morganite', 
    'Alexandrite', 'Turquoise', 'Jade', 'Lapis Lazuli', 
    'Moonstone', 'Onyx', 'Pearl', 'Spinel', 'Zircon', 'Other'
  )
  AND "organization_id" IS NOT NULL
ON CONFLICT DO NOTHING; 