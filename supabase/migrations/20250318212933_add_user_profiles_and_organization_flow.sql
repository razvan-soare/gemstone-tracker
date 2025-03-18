-- Create profiles table to store user names and additional information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_onboarded BOOLEAN DEFAULT FALSE NOT NULL
);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Function to create an organization and add the current user as a member
CREATE OR REPLACE FUNCTION public.create_organization_and_add_member(organization_name TEXT)
RETURNS UUID AS $$
DECLARE
  organization_id UUID;
  user_id UUID := auth.uid();
BEGIN
  -- Create new organization
  INSERT INTO public.organizations (name, user_id)
  VALUES (organization_name, user_id)
  RETURNING id INTO organization_id;
  
  -- Add the user as a member with 'owner' role
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (organization_id, user_id, 'owner');
  
  -- Mark user as onboarded
  UPDATE public.profiles
  SET is_onboarded = TRUE
  WHERE id = user_id;
  
  RETURN organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update profile name and create organization
CREATE OR REPLACE FUNCTION public.complete_onboarding(user_name TEXT, organization_name TEXT)
RETURNS UUID AS $$
DECLARE
  organization_id UUID;
  user_id UUID := auth.uid();
BEGIN
  -- Update user's name
  UPDATE public.profiles
  SET name = user_name, is_onboarded = TRUE
  WHERE id = user_id;
  
  -- Create organization and add user as member
  organization_id := public.create_organization_and_add_member(organization_name);
  
  RETURN organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Additional policy updates for organization access
CREATE POLICY "Organization members can view other members' profiles"
ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.user_id = auth.uid()
    AND organization_members.organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE organization_members.user_id = profiles.id
    )
  )
);

-- Grant access to the public schema for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_and_add_member TO authenticated;
