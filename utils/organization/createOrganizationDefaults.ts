import { SupabaseClient } from "@supabase/supabase-js";
import { GemstoneColor, GemstoneShape, GemstoneType } from "@/app/types/gemstone";
import { Tables } from "@/lib/database.types";
import { QueryClient } from "@tanstack/react-query";

/**
 * Creates an organization with default setup data (gemstone types, shapes, colors)
 * @param supabase Supabase client instance
 * @param organizationDetails Organization name and user_id
 * @param queryClient Optional query client to invalidate relevant queries
 * @returns The created organization or null if error
 */
export const createOrganizationWithDefaults = async (
  supabase: SupabaseClient,
  organizationDetails: {
    name: string;
    user_id: string;
  },
  queryClient?: QueryClient
): Promise<Tables<"organizations"> | null> => {
  try {
    // Create the organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert(organizationDetails)
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return null;
    }

    // Add user as owner of the organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organization.id,
        user_id: organizationDetails.user_id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error adding user to organization:", memberError);
      // Continue even if there's an error
    }

    // Add default gemstone types for the new organization
    const defaultGemstoneTypes = Object.values(GemstoneType);

    // Create batch insert data
    const gemstoneTypesData = defaultGemstoneTypes.map((name) => ({
      organization_id: organization.id,
      name,
    }));

    // Insert default gemstone types
    const { error: gemstoneTypesError } = await supabase
      .from("organization_gemstone_types")
      .insert(gemstoneTypesData);

    if (gemstoneTypesError) {
      console.error("Error adding default gemstone types:", gemstoneTypesError);
      // Continue even if there's an error with gemstone types
    }

    // Add default shapes
    const defaultShapes = Object.values(GemstoneShape);

    const shapesData = defaultShapes.map((name) => ({
      organization_id: organization.id,
      name,
    }));

    const { error: shapesError } = await supabase
      .from("organization_shapes")
      .insert(shapesData);

    if (shapesError) {
      console.error("Error adding default shapes:", shapesError);
      // Continue even if there's an error with shapes
    }

    // Add default colors
    const defaultColors = Object.values(GemstoneColor);

    const colorsData = defaultColors.map((name) => ({
      organization_id: organization.id,
      name,
    }));

    const { error: colorsError } = await supabase
      .from("organization_colors")
      .insert(colorsData);

    if (colorsError) {
      console.error("Error adding default colors:", colorsError);
      // Continue even if there's an error with colors
    }

    // Invalidate relevant queries if queryClient is provided
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ["organization_members"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-gemstone-types"] });
      queryClient.invalidateQueries({ queryKey: ["organization-colors"] });
      queryClient.invalidateQueries({ queryKey: ["organization-shapes"] });
      queryClient.invalidateQueries({ queryKey: ["gemstone"] });
      queryClient.invalidateQueries({ queryKey: ["gemstones"] });
    }

    return organization;
  } catch (error) {
    console.error("Error in createOrganizationWithDefaults:", error);
    return null;
  }
}; 