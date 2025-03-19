import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for fetching and managing organization-specific colors
 * 
 * Provides:
 * - List of colors for the active organization
 * - Function to add a new color
 * - Function to delete a color
 * - Function to count stones by color
 */
export const useOrganizationColors = () => {
  const { activeOrganization } = useSupabase();
  const queryClient = useQueryClient();

  // Fetch all colors for the active organization
  const query = useQuery({
    queryKey: ["organization-colors", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("organization_colors")
        .select("*")
        .eq("organization_id", activeOrganization.id)
        .order("name");

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!activeOrganization?.id,
  });

  // Count stones by color
  const stoneCountsQuery = useQuery({
    queryKey: ["color-stone-counts", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return {};
      }

      // Get all stones for the organization
      const { data, error } = await supabase
        .from("stones")
        .select("color_id, color, organization_colors(id, name)")
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      // Count stones by color
      const counts: Record<string, number> = {};
      data.forEach(stone => {
        // Use color_id if available, otherwise use color string
        const colorId = stone.color_id || (stone.color || "");
        if (colorId) {
          counts[colorId] = (counts[colorId] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!activeOrganization?.id,
  });

  // Add a new color
  const addColor = useMutation({
    mutationFn: async (name: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      // Don't add empty names
      if (!name.trim()) {
        return null;
      }

      const { data, error } = await supabase
        .from("organization_colors")
        .insert({
          organization_id: activeOrganization.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) {
        // If the error is a unique constraint violation, it means the color already exists
        if (error.code === "23505") {
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-colors", activeOrganization?.id],
      });
    },
  });

  // Delete a color
  const deleteColor = useMutation({
    mutationFn: async (colorId: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      const { error } = await supabase
        .from("organization_colors")
        .delete()
        .eq("id", colorId)
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-colors", activeOrganization?.id],
      });
    },
  });

  return {
    colors: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stoneCounts: stoneCountsQuery.data || {},
    isLoadingStoneCounts: stoneCountsQuery.isLoading,
    addColor,
    deleteColor,
  };
}; 