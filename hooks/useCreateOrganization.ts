import { supabase } from "@/config/supabase";
import { Tables } from "@/lib/database.types";
import { GemstoneShape, GemstoneColor, GemstoneType } from "@/app/types/gemstone";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Hook to create a new organization
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      userId,
    }: {
      name: string;
      userId: string;
    }) => {
      
				// Create a new organization
				const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: name,
          user_id: userId,
        })
        .select()
        .single();

      if (orgError) throw orgError;
      
      if (!organization) {
        throw new Error("Failed to create organization");
      }

      // Add user as owner of the organization
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organization.id,
          user_id: userId,
          role: "owner",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (memberError) {
        // If adding as member fails, try to clean up by deleting the org
        await supabase
          .from("organizations")
          .delete()
          .eq("id", organization.id);
        throw memberError;
      }

      // Add default owner with same name as organization
      const { error: ownerError } = await supabase
        .from("organization_owners")
        .insert({
          organization_id: organization.id,
          name: name,
        });

      if (ownerError) {
        console.error("Error creating default owner:", ownerError);
        // Continue despite error
      }

      // Add default shapes
      const defaultShapes = Object.values(GemstoneShape);
      
      const shapesData = defaultShapes.map((shapeName) => ({
        organization_id: organization.id,
        name: shapeName as string,
      }));
      
      const { error: shapesError } = await supabase
        .from("organization_shapes")
        .insert(shapesData);
      
      if (shapesError) {
        console.error("Error adding default shapes:", shapesError);
        // Continue despite error
      }
      
      // Add default colors
      const defaultColors = Object.values(GemstoneColor);
      
      const colorsData = defaultColors.map((colorName) => ({
        organization_id: organization.id,
        name: colorName as string,
      }));
      
      const { error: colorsError } = await supabase
        .from("organization_colors")
        .insert(colorsData);
      
      if (colorsError) {
        console.error("Error adding default colors:", colorsError);
        // Continue despite error
      }
      
      // Add default gemstone types
      const defaultGemstoneTypes = Object.values(GemstoneType);
      
      const gemstoneTypesData = defaultGemstoneTypes.map((typeName) => ({
        organization_id: organization.id,
        name: typeName as string,
      }));
      
      const { error: gemstoneTypesError } = await supabase
        .from("organization_gemstone_types")
        .insert(gemstoneTypesData);
      
      if (gemstoneTypesError) {
        console.error("Error adding default gemstone types:", gemstoneTypesError);
        // Continue despite error
      }

      return organization as Tables<"organizations">;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["organization_members"] });
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
    },
  });
}; 