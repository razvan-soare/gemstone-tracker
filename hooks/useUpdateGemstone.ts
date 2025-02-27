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
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["gemstone", activeOrganization],
			});
			queryClient.invalidateQueries({
				queryKey: ["gemstones", activeOrganization],
			});
		},
	});
};
