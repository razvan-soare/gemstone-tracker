import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for fetching and managing organization-specific owners
 * 
 * Provides:
 * - List of owners for the active organization
 * - Function to add a new owner
 * - Function to delete an owner
 * - Function to count stones by owner
 */
export const useOrganizationOwners = () => {
  const { activeOrganization } = useSupabase();
  const queryClient = useQueryClient();

  // Fetch all owners for the active organization
  const query = useQuery({
    queryKey: ["organization-owners", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from("organization_owners")
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

  // Count stones by owner
  const stoneCountsQuery = useQuery({
    queryKey: ["owner-stone-counts", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        return {};
      }

      // Get all stones for the organization
      const { data, error } = await supabase
        .from("stones")
        .select("owner")
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      // Count stones by owner
      const counts: Record<string, number> = {};
      data.forEach(stone => {
        if (stone.owner) {
          counts[stone.owner] = (counts[stone.owner] || 0) + 1;
        }
      });

      return counts;
    },
    enabled: !!activeOrganization?.id,
  });

  // Add a new owner
  const addOwner = useMutation({
    mutationFn: async (name: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      // Don't add empty names
      if (!name.trim()) {
        return null;
      }

      const { data, error } = await supabase
        .from("organization_owners")
        .insert({
          organization_id: activeOrganization.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) {
        // If the error is a unique constraint violation, it means the owner already exists
        if (error.code === "23505") {
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-owners", activeOrganization?.id],
      });
    },
  });

  // Delete an owner
  const deleteOwner = useMutation({
    mutationFn: async (ownerId: string) => {
      if (!activeOrganization?.id) {
        throw new Error("No active organization");
      }

      const { error } = await supabase
        .from("organization_owners")
        .delete()
        .eq("id", ownerId)
        .eq("organization_id", activeOrganization.id);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-owners", activeOrganization?.id],
      });
    },
  });

  return {
    owners: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    stoneCounts: stoneCountsQuery.data || {},
    isLoadingStoneCounts: stoneCountsQuery.isLoading,
    addOwner,
    deleteOwner,
  };
}; 