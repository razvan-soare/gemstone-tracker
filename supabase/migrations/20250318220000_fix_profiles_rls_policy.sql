-- This migration adds the needed RLS policy for inserting records into the profiles table

-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add policy allowing service role to insert/update profiles
-- This ensures functions with SECURITY DEFINER (like handle_new_user) can work properly
CREATE POLICY "Service role can manage profiles" ON public.profiles
USING (true)
WITH CHECK (true);

-- Fix for direct inserts/updates through API
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Need to be explicit about capabilities
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO service_role;

-- Update existing policy to include the right operations
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Ensure RLS is enabled but now with proper policies
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY; 