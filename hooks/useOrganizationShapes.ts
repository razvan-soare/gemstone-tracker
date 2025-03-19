import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for fetching and managing organization-specific shapes
 * 
 * Provides:
 * - List of shapes for the active organization
 * - Function to add a new shape
 * - Function to delete a shape
 * - Function to count stones by shape
 */
export const useOrganizationShapes = () => {
  const { activeOrganization } = useSupabase();
  const queryClient = useQueryClient();

  // Fetch all shapes for the active organization
  const query = useQuery({
    queryKey: ["organization-shapes", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("organization_shapes")
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

  // Count stones by shape
  const stoneCountsQuery = useQuery({
    queryKey: ["shape-stone-counts", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return {};
      }

      // Get all stones for the organization
      const { data, error } = await supabase
        .from("stones")
        .select("shape_id, shape, organization_shapes(id, name)")
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      // Count stones by shape
      const counts: Record<string, number> = {};
      data.forEach(stone => {
        // Use shape_id if available, otherwise use shape string
        const shapeId = stone.shape_id || (stone.shape || "");
        if (shapeId) {
          counts[shapeId] = (counts[shapeId] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!activeOrganization?.id,
  });

  // Add a new shape
  const addShape = useMutation({
    mutationFn: async (name: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      // Don't add empty names
      if (!name.trim()) {
        return null;
      }

      const { data, error } = await supabase
        .from("organization_shapes")
        .insert({
          organization_id: activeOrganization.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) {
        // If the error is a unique constraint violation, it means the shape already exists
        if (error.code === "23505") {
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-shapes", activeOrganization?.id],
      });
    },
  });

  // Delete a shape
  const deleteShape = useMutation({
    mutationFn: async (shapeId: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      const { error } = await supabase
        .from("organization_shapes")
        .delete()
        .eq("id", shapeId)
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-shapes", activeOrganization?.id],
      });
    },
  });

  return {
    shapes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stoneCounts: stoneCountsQuery.data || {},
    isLoadingStoneCounts: stoneCountsQuery.isLoading,
    addShape,
    deleteShape,
  };
}; 