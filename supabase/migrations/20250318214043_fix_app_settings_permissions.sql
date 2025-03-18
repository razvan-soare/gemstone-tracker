-- Enable RLS on app_settings table if not already enabled
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Add policy for service role to insert/update app_settings
CREATE POLICY "Allow service role to manage app_settings" ON public.app_settings
FOR ALL
TO service_role
USING (true);

-- Add policy for authenticated users to insert/update app_settings (for seeding purposes)
CREATE POLICY "Allow authenticated users to manage app_settings" ON public.app_settings
FOR ALL
TO authenticated
USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
