-- Create organization_shapes table to store organization-specific shape values
CREATE TABLE IF NOT EXISTS "public"."organization_shapes" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organization_shapes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_shapes_organization_id_name_key" UNIQUE ("organization_id", "name"),
  CONSTRAINT "organization_shapes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE
);

-- Add RLS policies to allow organization members to manage shapes
CREATE POLICY "Organization members can manage shapes" ON "public"."organization_shapes"
  USING (EXISTS (
    SELECT 1 FROM "public"."organization_members"
    WHERE "organization_members"."organization_id" = "organization_shapes"."organization_id"
    AND "organization_members"."user_id" = auth.uid()
  ));

-- Add trigger for updated_at column
CREATE TRIGGER "update_organization_shapes_updated_at"
  BEFORE UPDATE ON "public"."organization_shapes"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable RLS on the table
ALTER TABLE "public"."organization_shapes" ENABLE ROW LEVEL SECURITY;

-- Create organization_colors table to store organization-specific color values
CREATE TABLE IF NOT EXISTS "public"."organization_colors" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organization_colors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_colors_organization_id_name_key" UNIQUE ("organization_id", "name"),
  CONSTRAINT "organization_colors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE
);

-- Add RLS policies to allow organization members to manage colors
CREATE POLICY "Organization members can manage colors" ON "public"."organization_colors"
  USING (EXISTS (
    SELECT 1 FROM "public"."organization_members"
    WHERE "organization_members"."organization_id" = "organization_colors"."organization_id"
    AND "organization_members"."user_id" = auth.uid()
  ));

-- Add trigger for updated_at column
CREATE TRIGGER "update_organization_colors_updated_at"
  BEFORE UPDATE ON "public"."organization_colors"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable RLS on the table
ALTER TABLE "public"."organization_colors" ENABLE ROW LEVEL SECURITY;

-- Add shape_id and color_id columns to stones table
ALTER TABLE "public"."stones" ADD COLUMN IF NOT EXISTS "shape_id" uuid;
ALTER TABLE "public"."stones" ADD COLUMN IF NOT EXISTS "color_id" uuid;

-- Add foreign key constraints
ALTER TABLE "public"."stones" 
  ADD CONSTRAINT "stones_shape_id_fkey" 
  FOREIGN KEY ("shape_id") 
  REFERENCES "public"."organization_shapes"("id") 
  ON DELETE SET NULL;

ALTER TABLE "public"."stones" 
  ADD CONSTRAINT "stones_color_id_fkey" 
  FOREIGN KEY ("color_id") 
  REFERENCES "public"."organization_colors"("id") 
  ON DELETE SET NULL;

-- Seed default shapes for each organization
INSERT INTO "public"."organization_shapes" ("organization_id", "name")
SELECT 
  "organizations"."id", 
  "shape_name"
FROM 
  "public"."organizations"
CROSS JOIN (
  VALUES 
    ('Marquise'),
    ('Round'),
    ('Trillion'),
    ('Oval'),
    ('Pear'),
    ('Square'),
    ('Octagon'),
    ('Emerald'),
    ('Baguette'),
    ('Cushion'),
    ('Heart'),
    ('Cobochon'),
    ('Princess'),
    ('Radiant'),
    ('Asscher')
) AS "shapes"("shape_name")
ON CONFLICT DO NOTHING;

-- Seed default colors for each organization
INSERT INTO "public"."organization_colors" ("organization_id", "name")
SELECT 
  "organizations"."id", 
  "color_name"
FROM 
  "public"."organizations"
CROSS JOIN (
  VALUES 
    ('Royal Blue'),
    ('Corn Flower'),
    ('Pinkish Purple'),
    ('Neon Pink'),
    ('Hot Pink'),
    ('Blue'),
    ('Red'),
    ('Pink'),
    ('Yellow'),
    ('Green'),
    ('Orange'),
    ('Pink & Orange'),
    ('Brown'),
    ('Black'),
    ('White'),
    ('Colorless'),
    ('Neon Blue'),
    ('Purple'),
    ('Multi-colored')
) AS "colors"("color_name")
ON CONFLICT DO NOTHING;

-- Migrate existing stone shape data
-- For each stone, look up the shape in organization_shapes and set shape_id
UPDATE "public"."stones" 
SET "shape_id" = "organization_shapes"."id"
FROM "public"."organization_shapes"
WHERE 
  "stones"."organization_id" = "organization_shapes"."organization_id" 
  AND "stones"."shape" = "organization_shapes"."name"
  AND "stones"."shape" IS NOT NULL
  AND "stones"."shape_id" IS NULL;

-- Import any unique existing shapes that aren't in default list
INSERT INTO "public"."organization_shapes" ("organization_id", "name")
SELECT DISTINCT "organization_id", "shape" 
FROM "public"."stones" 
WHERE "shape" IS NOT NULL 
  AND "shape" NOT IN (
    'Marquise', 'Round', 'Trillion', 'Oval', 'Pear', 
    'Square', 'Octagon', 'Emerald', 'Baguette', 'Cushion', 
    'Heart', 'Cobochon', 'Princess', 'Radiant', 'Asscher'
  )
  AND "organization_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Migrate existing stone color data
-- For each stone, look up the color in organization_colors and set color_id
UPDATE "public"."stones" 
SET "color_id" = "organization_colors"."id"
FROM "public"."organization_colors"
WHERE 
  "stones"."organization_id" = "organization_colors"."organization_id" 
  AND "stones"."color" = "organization_colors"."name"
  AND "stones"."color" IS NOT NULL
  AND "stones"."color_id" IS NULL;

-- Import any unique existing colors that aren't in default list
INSERT INTO "public"."organization_colors" ("organization_id", "name")
SELECT DISTINCT "organization_id", "color" 
FROM "public"."stones" 
WHERE "color" IS NOT NULL 
  AND "color" NOT IN (
    'Royal Blue', 'Corn Flower', 'Pinkish Purple', 'Neon Pink', 'Hot Pink',
    'Blue', 'Red', 'Pink', 'Yellow', 'Green', 'Orange', 'Pink & Orange',
    'Brown', 'Black', 'White', 'Colorless', 'Neon Blue', 'Purple', 'Multi-colored'
  )
  AND "organization_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update any remaining stones without shape_id or color_id
UPDATE "public"."stones" 
SET "shape_id" = "organization_shapes"."id"
FROM "public"."organization_shapes"
WHERE 
  "stones"."organization_id" = "organization_shapes"."organization_id" 
  AND "stones"."shape" = "organization_shapes"."name"
  AND "stones"."shape_id" IS NULL;

UPDATE "public"."stones" 
SET "color_id" = "organization_colors"."id"
FROM "public"."organization_colors"
WHERE 
  "stones"."organization_id" = "organization_colors"."organization_id" 
  AND "stones"."color" = "organization_colors"."name"
  AND "stones"."color_id" IS NULL;
