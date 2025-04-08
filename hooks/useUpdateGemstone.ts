import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateGemstoneInput = Partial<Tables<"stones">> & { id: string };

export const useUpdateGemstone = () => {
	const queryClient = useQueryClient();
	const { activeOrganization } = useSupabase();
	return useMutation({
		mutationFn: async (input: UpdateGemstoneInput) => {
			const { id, ...updates } = input;
			const { data, error } = await supabase
				.from("stones")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (_data, variables) => {
			// Invalidate gemstone detail query by ID
			if (variables?.id) {
				queryClient.invalidateQueries({
					queryKey: ["gemstone", variables.id],
				});
			}

			// Invalidate gemstone list queries
			queryClient.invalidateQueries({
				queryKey: ["gemstones", activeOrganization],
			});

			// Invalidate gemstones-by-date (history page) queries
			queryClient.invalidateQueries({
				queryKey: ["gemstones-by-date", activeOrganization?.id],
				exact: false,
			});
		},
	});
};
