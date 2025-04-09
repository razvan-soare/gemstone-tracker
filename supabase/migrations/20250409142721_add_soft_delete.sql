-- Adds soft delete columns to public.stones
ALTER TABLE "public"."stones"
ADD COLUMN "deleted_at" timestamp NULL,
ADD COLUMN "deleted_by" uuid NULL REFERENCES auth.users(id);