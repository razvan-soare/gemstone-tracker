-- Rename gem_type column to gem_treatment in stones table
ALTER TABLE public.stones RENAME COLUMN gem_type TO gem_treatment;

-- Add comment explaining the purpose of the field
COMMENT ON COLUMN public.stones.gem_treatment IS 'Indicates if the gemstone is natural or has undergone treatment like heating';

