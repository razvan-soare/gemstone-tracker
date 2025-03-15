import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for fetching and managing organization-specific gemstone types
 * 
 * Provides:
 * - List of gemstone types for the active organization
 * - Function to add a new gemstone type
 * - Function to delete a gemstone type
 * - Function to count stones by gemstone type
 */
export const useOrganizationGemstoneTypes = () => {
  const { activeOrganization } = useSupabase();
  const queryClient = useQueryClient();

  // Fetch all gemstone types for the active organization
  const query = useQuery({
    queryKey: ["organization-gemstone-types", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("organization_gemstone_types")
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

  // Count stones by gemstone type
  const stoneCountsQuery = useQuery({
    queryKey: ["gemstone-type-stone-counts", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return {};
      }

      // Get all stones for the organization
      const { data, error } = await supabase
        .from("stones")
        .select("name, gem_type_id")
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      // Count stones by gemstone type (both by name and by gem_type_id)
      const counts: Record<string, number> = {};
      const idCounts: Record<string, number> = {};
      
      data.forEach(stone => {
        if (stone.name) {
          counts[stone.name] = (counts[stone.name] || 0) + 1;
        }
        if (stone.gem_type_id) {
          idCounts[stone.gem_type_id] = (idCounts[stone.gem_type_id] || 0) + 1;
        }
      });

      return { nameCounts: counts, idCounts };
    },
    enabled: !!activeOrganization?.id,
  });

  // Add a new gemstone type
  const addGemstoneType = useMutation({
    mutationFn: async (name: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      // Don't add empty names
      if (!name.trim()) {
        return null;
      }

      const { data, error } = await supabase
        .from("organization_gemstone_types")
        .insert({
          organization_id: activeOrganization.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) {
        // If the error is a unique constraint violation, it means the gemstone type already exists
        if (error.code === "23505") {
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-gemstone-types", activeOrganization?.id],
      });
    },
  });

  // Delete a gemstone type
  const deleteGemstoneType = useMutation({
    mutationFn: async (gemstoneTypeId: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      const { error } = await supabase
        .from("organization_gemstone_types")
        .delete()
        .eq("id", gemstoneTypeId)
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-gemstone-types", activeOrganization?.id],
      });
    },
  });

  return {
    gemstoneTypes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stoneCounts: stoneCountsQuery.data?.nameCounts || {},
    stoneIdCounts: stoneCountsQuery.data?.idCounts || {},
    isLoadingStoneCounts: stoneCountsQuery.isLoading,
    addGemstoneType,
    deleteGemstoneType,
  };
}; 